import { Router } from 'express';
import { marketHub } from '../services/marketHub';
import { MarketQuote } from '../types';

export const sseRouter = Router();

sseRouter.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', circuit: marketHub.getCircuitStatus() })}\n\n`);

  const onQuotesBatch = (quotes: MarketQuote[]) => {
    res.write(`data: ${JSON.stringify({ type: 'QUOTES_UPDATE', quotes })}\n\n`);
  };

  const onCircuitChanged = (circuit: any) => {
    res.write(`data: ${JSON.stringify({ type: 'CIRCUIT_UPDATE', circuit })}\n\n`);
  };

  marketHub.on('quotes_batch', onQuotesBatch);
  marketHub.on('circuit_changed', onCircuitChanged);

  // Heartbeat every 15s to keep connection open
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    marketHub.off('quotes_batch', onQuotesBatch);
    marketHub.off('circuit_changed', onCircuitChanged);
  });
});

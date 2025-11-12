// src/middlewares/rateLimit.ts
import type { RequestHandler } from "express";
import rateLimit from "express-rate-limit";

const isTest = process.env.NODE_ENV === "test";

// In tests just pass through
const passthrough: RequestHandler = (_req, _res, next) => next();

// leave as false for dev
// if behind a proxy set to true or number of proxies
export const TRUST_PROXY_VALUE: boolean | number | string = false;

// General API limiter (100 req / 15min per IP)
export const apiLimiter: RequestHandler = isTest
  ? passthrough
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: "Too many requests, please try again later.",
      },
    });

// Auth limiter (10 req / 10min per IP)
export const authLimiter: RequestHandler = isTest
  ? passthrough
  : rateLimit({
      windowMs: 10 * 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: "Too many auth attempts. Try again later.",
      },
    });

// Product search limiter (60 req / 1min per IP)
export const productsLimiter: RequestHandler = isTest
  ? passthrough
  : rateLimit({
      windowMs: 60 * 1000,
      max: 60,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: "Too many product requests. Slow down.",
      },
    });

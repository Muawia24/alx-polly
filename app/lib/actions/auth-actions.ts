'use server';

import { createClient } from '@/lib/supabase/server';
import { LoginFormData, RegisterFormData } from '../types';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';

const redisClient = new Redis();
  const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    points: 5,
    duration: 60 * 15, 
  });

export async function login(data: LoginFormData) {
  if (!data.email || !data.password) {
    return { error: "Email and password are required" };
  }

  try {
    await rateLimiter.consume(data.email);
  } catch (err) {
    return { error: "Too many login attempts. Please try again later." };
  }
  
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return { error: "Wrong email or password" };
  }

  // Success: no error
  return { error: null };
}

export async function register(data: RegisterFormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Success: no error
  return { error: null };
}

export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

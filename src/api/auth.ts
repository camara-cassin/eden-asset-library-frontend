import { get, post } from './client';
import type { User, LoginRequest, SignupRequest, TokenResponse, SignupResponse } from '../types/auth';

export async function login(data: LoginRequest): Promise<TokenResponse> {
  return post<TokenResponse>('/auth/login', data);
}

export async function signup(data: SignupRequest): Promise<SignupResponse> {
  return post<SignupResponse>('/auth/signup', data);
}

export async function getMe(): Promise<User> {
  return get<User>('/auth/me');
}

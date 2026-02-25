import axios from 'axios';
import { config } from '../config/config.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('AdminV2Client');

export interface AdminV2RequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  endpoint: string;
  data?: any;
  params?: Record<string, any>;
}

export interface AdminV2PaginatedResponse<T> {
  page: number;
  per_page: number;
  has_next_page: boolean;
  count: number;
  page_count: number;
  records: T[];
}

export function isAdminV2Configured(): boolean {
  return !!config.adminV2Token;
}

export async function adminV2Request<T = any>(options: AdminV2RequestOptions): Promise<T> {
  const { method, endpoint, data, params } = options;
  const url = `${config.headlessBaseUrl}/api/admin/v2${endpoint}`;

  logger.debug(`Admin V2 ${method} ${endpoint}`, { params });

  const response = await axios({
    method,
    url,
    data,
    params,
    headers: {
      'Authorization': `Bearer ${config.adminV2Token}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });

  return response.data;
}

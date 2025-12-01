import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '1m',
  thresholds: {
    'http_req_duration': ['p(95)<1000'], // 95% requests < 1s
    'http_req_failed': ['rate<0.1'],     // < 10% errores
  },
};

const BASE_URL = __ENV.SERVICE_URL;

export default function () {
  // Test health endpoint only
  http.get(`${BASE_URL}/health`);
  sleep(1);
}

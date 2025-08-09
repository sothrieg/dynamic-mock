export interface AuthConfig {
  username: string;
  password: string;
}

export const DEFAULT_AUTH: AuthConfig = {
  username: 'test',
  password: 'test'
};

export function parseBasicAuth(authHeader: string | null): { username: string; password: string } | null {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return null;
  }

  try {
    const base64Credentials = authHeader.slice(6); // Remove 'Basic ' prefix
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');
    
    if (!username || !password) {
      return null;
    }

    return { username, password };
  } catch (error) {
    return null;
  }
}

export function validateCredentials(username: string, password: string): boolean {
  return username === DEFAULT_AUTH.username && password === DEFAULT_AUTH.password;
}

export function createAuthChallenge(): Response {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="JSON Schema API", charset="UTF-8"',
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Origin, X-Requested-With',
    },
  });
}

export function withBasicAuth<T extends any[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    const request = args[0] as Request;
    
    // Skip auth for OPTIONS requests (CORS preflight)
    if (request.method === 'OPTIONS') {
      return handler(...args);
    }

    const authHeader = request.headers.get('Authorization');
    const credentials = parseBasicAuth(authHeader);

    if (!credentials || !validateCredentials(credentials.username, credentials.password)) {
      return createAuthChallenge();
    }

    return handler(...args);
  };
}
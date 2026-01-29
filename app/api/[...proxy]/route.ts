import { NextRequest, NextResponse } from 'next/server';

// Backend API URL - defaults to localhost:8081
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8081';

// Base path when deployed under IIS as a sub-application
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/daily-reports';

async function proxyHandler(req: NextRequest): Promise<NextResponse> {
    // Remove the base path and /api prefix to get the actual API path
    let path = req.nextUrl.pathname;

    // If deployed under /daily-reports, remove that prefix first
    if (path.startsWith(BASE_PATH)) {
        path = path.substring(BASE_PATH.length);
    }

    // Remove /api prefix to get the backend route
    path = path.replace('/api', '');

    // Construct the target URL with query parameters
    const targetUrl = `${BACKEND_API_URL}/api${path}${req.nextUrl.search}`;

    // Forward headers but remove problematic ones
    const headers = new Headers();
    headers.set('X-App-Source', 'daily-reports');
    headers.set('Accept', 'application/json');

    // Copy content-type if present (for POST/PUT requests)
    const contentType = req.headers.get('content-type');
    if (contentType) {
        headers.set('Content-Type', contentType);
    }

    try {
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: headers,
            body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
            // @ts-ignore - duplex is needed for streaming request bodies
            duplex: 'half',
        });

        const responseContentType = response.headers.get('content-type');
        const isJson = responseContentType && responseContentType.includes('application/json');

        // Read the response body as text to avoid encoding issues
        const responseText = await response.text();

        // Build clean response headers without encoding issues
        const newHeaders = new Headers();
        if (responseContentType) {
            newHeaders.set('Content-Type', responseContentType);
        }

        // If it's a JSON error response, normalize the error format
        if (isJson && !response.ok) {
            try {
                const json = JSON.parse(responseText);
                if (json.detail && !json.error) {
                    const errorMsg = typeof json.detail === 'string'
                        ? json.detail
                        : Array.isArray(json.detail)
                            ? json.detail.map((e: { msg: string }) => e.msg).join(', ')
                            : JSON.stringify(json.detail);
                    json.error = errorMsg;
                }
                return NextResponse.json(json, { status: response.status, headers: newHeaders });
            } catch {
                // If JSON parsing fails, return as-is
            }
        }

        return new NextResponse(responseText, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
        });
    } catch (error) {
        console.error('API proxy error:', error);
        return NextResponse.json(
            { error: 'Error forwarding request to the backend.' },
            { status: 502 }
        );
    }
}

export async function GET(req: NextRequest) {
    return proxyHandler(req);
}

export async function POST(req: NextRequest) {
    return proxyHandler(req);
}

export async function PUT(req: NextRequest) {
    return proxyHandler(req);
}

export async function DELETE(req: NextRequest) {
    return proxyHandler(req);
}

export async function PATCH(req: NextRequest) {
    return proxyHandler(req);
}

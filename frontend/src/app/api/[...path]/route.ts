import { handleApiRequest } from "@ssc13bd/backend";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = handleApiRequest;
export const POST = handleApiRequest;
export const PATCH = handleApiRequest;
export const DELETE = handleApiRequest;

export const maxDuration = 10;

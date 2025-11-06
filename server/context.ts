// Permissive TrpcContext used across server modules for static typing.
// Adjust fields as needed when refining types.
export interface TrpcContext {
	user?: {
		id: number;
		openId?: string | null;
		username?: string | null;
		name?: string | null;
		email: string;
		password?: string | null;
		role?: string | null;
		lastSignedIn?: Date;
		[key: string]: unknown;
	} | null;

	// Express-like request object used in many server routes. Keep permissive
	// shape to avoid brittle type errors until a full refactor is done.
	req?: {
		headers?: Record<string, string> & { origin?: string };
		protocol?: string;
		get?: (name: string) => string | undefined;
	} & Record<string, unknown>;

	// Express-like response object used for cookie operations and redirects.
	res?: {
		clearCookie?: (name: string, options?: Record<string, unknown>) => void;
		cookie?: (name: string, value: string, options?: Record<string, unknown>) => void;
		redirect?: (url: string) => void;
	} & Record<string, unknown>;

	[key: string]: unknown;
}

export type { TrpcContext as default };

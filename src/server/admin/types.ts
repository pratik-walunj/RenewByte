/**
 * Client-safe types shared by admin server actions and the forms that call them.
 * (No runtime imports, so client components may import from here.)
 */
export type FieldErrors = Record<string, string[] | undefined>;

export type ActionFailure = { ok: false; error: string; fieldErrors?: FieldErrors };

export type ActionResult<T extends object = object> = ({ ok: true; message?: string } & T) | ActionFailure;

export type Option = { value: string; label: string };

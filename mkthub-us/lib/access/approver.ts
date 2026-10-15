/** Correo de la persona administradora (ACCESS_APPROVER_EMAIL). Sin dependencias: válido también en Edge. */
export function getApproverEmail(): string | null {
  return process.env.ACCESS_APPROVER_EMAIL?.trim().toLowerCase() || null;
}

export function isApprover(email?: string | null): boolean {
  const approver = getApproverEmail();
  return Boolean(approver && email?.trim().toLowerCase() === approver);
}

export const ROLES = ["superadmin", "admin", "manager", "trader", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const PRIVILEGES = {
  TRADE: "trade",
  VIEW_POSITIONS: "view_positions",
  VIEW_ORDERS: "view_orders",
  VIEW_MARKET: "view_market",
  MANAGE_USERS: "manage_users",
  MANAGE_ROLES: "manage_roles",
  VIEW_AUDIT: "view_audit",
  ADMIN: "admin",
  MANAGE_PAYROLL: "manage_payroll",
  VIEW_PAYROLL: "view_payroll",
  MANAGE_INVOICES: "manage_invoices",
  VIEW_INVOICES: "view_invoices",
} as const;

export const ROLE_PRIVILEGES: Record<Role, string[]> = {
  superadmin: Object.values(PRIVILEGES),
  admin: [
    "trade",
    "view_positions",
    "view_orders",
    "view_market",
    "manage_users",
    "view_audit",
    "manage_payroll",
    "view_payroll",
    "manage_invoices",
    "view_invoices",
  ],
  manager: ["view_positions", "view_orders", "view_market", "view_audit", "view_payroll", "view_invoices"],
  trader: ["trade", "view_positions", "view_orders", "view_market"],
  viewer: ["view_market"],
};

export function roleRank(role: string): number {
  const idx = ROLES.indexOf(role as Role);
  return idx === -1 ? ROLES.length : idx;
}

export function hasPrivilege(
  role: string,
  extraPrivileges: string[],
  required: string
): boolean {
  const rolePrivs = getPrivilegesForRole(role);
  return rolePrivs.includes(required) || extraPrivileges.includes(required);
}

export function canManageRole(actorRole: string, targetRole: string): boolean {
  return roleRank(actorRole) < roleRank(targetRole);
}

export function getPrivilegesForRole(role: string): string[] {
  return ROLE_PRIVILEGES[role as Role] ?? [];
}

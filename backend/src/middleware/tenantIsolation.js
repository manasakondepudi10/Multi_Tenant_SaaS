export const isolateTenant = (req, res, next) => {
  if (req.user.role !== "super_admin") {
    req.tenantId = req.user.tenantId;
  }
  next();
};

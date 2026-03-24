// ============================================
// EXPRESS TYPE DECLARATIONS - Tipos Extendidos
// ============================================

import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
    user?: any;
  }
}

import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                role: string;
            };
        }
    }
}
/**
 * 认证中间件
 * 验证JWT token并设置req.user
 */
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * 商户权限中间件
 * 确保用户是商户或管理员
 */
export declare const merchantMiddleware: (req: Request, res: Response, next: NextFunction) => void;
/**
 * 管理员权限中间件
 * 确保用户是管理员
 */
export declare const adminMiddleware: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map
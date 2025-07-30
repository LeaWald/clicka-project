import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from '../services/auditLog.service';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const globalAuditMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // רק עבור פעולות שמשנות נתונים
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {

    const originalSend = res.send;

    res.send = function (data) {
      // בדיקה שהבקשה הצליחה
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setImmediate(() => {
          logAuditAsync(req, res, data);
        });
      }

      return originalSend.call(this, data);
    };
  }

  next();
};

async function logAuditAsync(req: AuthenticatedRequest, res: Response, responseData: any) {
  try {
    console.log(responseData);
    const auditService = new AuditLogService();
    console.log("req", req);

    // זיהוי הפונקציה מה-URL
    const functionName = extractFunctionFromUrl(req.baseUrl, req.method);

    let targetInfo = "";
    if (req.params.id) {
      targetInfo = req.params.id;
    }
    else {
      if (responseData) {
        try {
          const parsedData = typeof responseData === 'string'
            ? JSON.parse(responseData)
            : responseData;

          if (parsedData.id) {
            targetInfo = parsedData.id;
          }

        } catch (parseError) {
          console.error('Error parsing response data:', parseError);
        }
      }
    }

    // שימוש בפונקציה המעודכנת של AuditLogService
    await auditService.createAuditLog(req, {
      timestamp: new Date().toISOString(),
      action: req.method as 'POST' | 'PUT' | 'DELETE' | 'PATCH',
      functionName,
      targetInfo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Audit log error:', error);
  }
}

function extractFunctionFromUrl(path: string, method: string): string {
  // דוגמאות:
  // POST /api/users -> createUser
  // PUT /api/users/123 -> updateUser
  // DELETE /api/users/123 -> deleteUser
  // POST /api/vendors -> createVendor
  console.log(path);

  const parts = path.split('/').filter(p => p && p !== 'api');

  const resource = parts[0] || 'unknown';

  switch (method) {
    case 'POST':
      return `create${capitalize(resource)}`;
    case 'PUT':
      return `update${capitalize(resource)}`;
    case 'DELETE':
      return `delete${capitalize(resource)}`;
    case 'PATCH':
      return `patch${capitalize(resource)}`;
    default:
      return 'unknown';
  }
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/s$/, '');
}
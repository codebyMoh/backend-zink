// validate body
export function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: result.error.issues.map((issue) => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                })),
            });
        }
        // ✅ strongly typed, safe body
        req.body = result.data;
        next();
    };
}
// validate params
export function validateParams(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.params);
        if (!result.success) {
            return res.status(400).json({
                error: result.error.issues.map((issue) => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                })),
            });
        }
        // ✅ strongly typed, safe params
        req.validatedParams = result.data;
        next();
    };
}

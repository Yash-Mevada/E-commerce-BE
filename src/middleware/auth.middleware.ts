import crypto from "crypto"
import jwt from "jsonwebtoken"
import Users from "../model/user.model.js"
import Customer from "../model/customer.model.js"

let jwksCache: any[] = []

async function fetchJwks() {
  if (jwksCache.length > 0) return jwksCache
  const region = process.env.AWS_REGION || "us-east-1"
  const poolIds = [
    process.env.COGNITO_CUSTOMER_USER_POOL_ID,
    process.env.COGNITO_USER_POOL_ID
  ].filter((id, idx, arr) => Boolean(id) && arr.indexOf(id) === idx) as string[]

  let allKeys: any[] = []
  for (const poolId of poolIds) {
    try {
      const url = `https://cognito-idp.${region}.amazonaws.com/${poolId}/.well-known/jwks.json`
      const response = await fetch(url)
      const data = await response.json()
      if (data?.keys) {
        allKeys = allKeys.concat(data.keys)
      }
    } catch (error) {
      console.error(`Failed to fetch JWKS from Cognito pool ${poolId}:`, error)
    }
  }

  jwksCache = allKeys
  return jwksCache
}

async function verifyCognitoToken(token: string): Promise<any> {
  const decodedHeader = jwt.decode(token, { complete: true }) as any
  if (!decodedHeader || !decodedHeader.header || !decodedHeader.header.kid) {
    throw new Error("Invalid token format")
  }

  const kid = decodedHeader.header.kid
  const keys = await fetchJwks()
  const key = keys.find((k: any) => k.kid === kid)

  if (!key) {
    // If not found in cache, fetch again in case keys rotated
    jwksCache = []
    const updatedKeys = await fetchJwks()
    const updatedKey = updatedKeys.find((k: any) => k.kid === kid)
    if (!updatedKey) {
      throw new Error("Public key not found for token")
    }
    return verifyWithKey(token, updatedKey)
  }

  return verifyWithKey(token, key)
}

function verifyWithKey(token: string, jwk: any): any {
  const publicKey = crypto.createPublicKey({
    format: "jwk",
    key: jwk
  })
  return jwt.verify(token, publicKey, { algorithms: ["RS256"] })
}

export const authMiddleware = async (req: any, res: any, next: any) => {
  // Check if current route is public (accessible without login)
  const path = req.path
  const method = req.method

  const publicPaths = [
    "/api/users/create",
    "/api/users/login",
    "/api/customers/register",
    "/api/customers/login",
    "/api/products/all",
    "/api/categories/all"
  ]

  const isPublicProductDetail = method === "GET" && /^\/api\/products\/[^\/]+$/.test(path)
  const isPublicCategoryDetail = method === "GET" && /^\/api\/categories\/[^\/]+$/.test(path)

  if (publicPaths.includes(path) || isPublicProductDetail || isPublicCategoryDetail) {
    return next()
  }

  const token = req?.cookies?.token || req?.headers?.authorization?.split(" ")[1]

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "User have no token"
    })
  }

  try {
    let decordToken: any

    // Check if token is RS256 (Cognito) or HS256 (Local)
    const decoded: any = jwt.decode(token, { complete: true })
    if (decoded && decoded.header && decoded.header.alg === "RS256") {
      decordToken = await verifyCognitoToken(token)
    } else {
      // Fallback to local JWT verification for backward compatibility or local test tokens
      decordToken = jwt.verify(token, process.env.JWT_SECRET!)
    }

    if (!decordToken) {
      return res.status(401).json({
        success: false,
        message: "User is not authenticated"
      })
    }

    // Retrieve user or customer by cognito_sub or local ID depending on the token type
    let userData: any
    if (decordToken?.sub) {
      userData = await Users.findOne({
        where: { cognito_sub: decordToken.sub },
        attributes: ["id", "first_name", "last_name", "email", "phone_number", "role", "created_at", "updated_at"],
      })
      if (!userData) {
        userData = await Customer.findOne({
          where: { cognito_sub: decordToken.sub },
        })
      }
    } else {
      userData = await Users.findByPk(decordToken?.id, {
        attributes: ["id", "first_name", "last_name", "email", "phone_number", "role", "created_at", "updated_at"],
      })
    }

    if (!userData) {
      userData = await Customer.findOne({
        where: { access_token: token },
      })
    }

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }

    req.user = userData
    next()
  } catch (error: any) {
    console.error("JWT Verification failed:", error.message)
    return res.status(401).json({
      success: false,
      message: "User is not authenticated"
    })
  }
}
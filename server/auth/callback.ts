export function callbackDestination(value: string | null) {
  return value === "/account/password" ? "/account/password" : "/account"
}

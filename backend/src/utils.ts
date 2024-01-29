export function replaceLastSegment(url, newSegment) {
  // Split the URL by '/'
  const parts = url.split("/");

  // Replace the last segment with the new one
  parts[parts.length - 1] = newSegment;

  // Join the parts back to form the modified URL
  const modifiedUrl = parts.join("/");

  return modifiedUrl;
}

export function returnAPIEndpoint(chainId: string) {
  let api = "";

  switch (chainId) {
    case "E1":
    case "1":
      api = "https://api.multiversx.com";
      break;
    case "ED":
    case "D":
      api = "https://devnet-api.multiversx.com";
      break;
  }

  return api;
}

export const getUserFromToken = () => {
    const token = localStorage.getItem("token");
  
    if (!token) {
      return null;
    }
  
    try {
      const payload = token.split(".")[1];
  
      const decodedPayload = JSON.parse(
        atob(payload)
      );
  
      return decodedPayload;
    } catch (error) {
      console.error("Invalid token:", error);
      return null;
    }
  };
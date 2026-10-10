export default class UserDTO {
  static toPublicResponse(user) {
    if (!user) return null;

    return {
      id: (user._id ?? user.id).toString(),
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role
    };
  }

  static toAuthenticatedResponse(user) {
    if (!user) return null;

    return {
      id: user.id ?? user._id?.toString(),
      email: user.email,
      role: user.role
    };
  }
}

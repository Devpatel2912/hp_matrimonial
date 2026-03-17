const isPlaceholder = (value = "") =>
  value.includes("change_me") || value.includes("example") || value.includes("default");

export const validateEnv = () => {
  const access = process.env.JWT_ACCESS_SECRET || "";
  const refresh = process.env.JWT_REFRESH_SECRET || "";

  if (!access || !refresh) {
    throw new Error("JWT secrets missing in .env. You wrote: 'I chnage JWT' - set both access and refresh secrets.");
  }

  if (access === refresh) {
    throw new Error(
      "JWT access and refresh secrets must be different. You wrote: 'I chnage JWT' - use two different secrets."
    );
  }

  if (isPlaceholder(access) || isPlaceholder(refresh)) {
    throw new Error(
      "JWT secrets still look like placeholders. You wrote: 'I chnage JWT' - replace both with real random strings."
    );
  }

  if (access.length < 16 || refresh.length < 16) {
    throw new Error(
      "JWT secrets are too short. You wrote: 'I chnage JWT' - use at least 16+ characters each."
    );
  }
};

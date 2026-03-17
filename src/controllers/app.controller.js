export const bootstrap = async (_req, res) => {
  res.json({
    success: true,
    message: "Bootstrap fetched",
    data: {
      appName: "Hari Prabodham Matrimonial",
      supportEmail: "support@hariprabodham.example",
      membershipValidityYears: 5,
    },
  });
};

export const homeContent = async (_req, res) => {
  res.json({
    success: true,
    message: "Home content fetched",
    data: {
      highlights: [
        { title: "Privacy-First", description: "Data visible only to approved members." },
        { title: "Verified Profiles", description: "Manual verification flow supported." },
        { title: "Report & Safety", description: "Quick reporting and moderation workflow." },
      ],
    },
  });
};


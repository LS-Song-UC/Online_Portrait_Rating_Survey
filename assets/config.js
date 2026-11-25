// Survey configuration. Edit this file to change portraits, wording or codes.
// Portrait IDs are strings so leading zeros are kept exactly.

window.SURVEY_CONFIG = {
  demo: true,
  sheet: "1",

  // Fixed order: participants see portraits in exactly this order.
  // Files live in portraits/, named by ID.
  portraits: [
    { id: "0001", src: "portraits/0001.jpg" },
    { id: "0002", src: "portraits/0002.jpg" },
    { id: "0003", src: "portraits/0003.jpg" },
    { id: "0004", src: "portraits/0004.jpg" },
    { id: "0005", src: "portraits/0005.jpg" },
    { id: "0006", src: "portraits/0006.jpg" },
    { id: "0007", src: "portraits/0007.jpg" }
  ],

  // Same letters and order as the printed review sheet.
  ethnicity: [
    { code: "A", label: "White" },
    { code: "B", label: "Black" },
    { code: "C", label: "Indian" },
    { code: "D", label: "East Asian" },
    { code: "E", label: "Southeast Asian" },
    { code: "F", label: "Middle Eastern" },
    { code: "G", label: "Latino/Hispanic" },
    { code: "U", label: "Unclear" }
  ],

  gender: [
    { code: "F", label: "Female" },
    { code: "M", label: "Male" },
    { code: "U", label: "Unclear" }
  ],

  ageMin: 0,
  ageMax: 120
};

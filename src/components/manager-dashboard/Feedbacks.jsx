// MUI COMPONENTS
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  Chip,
  Stack,
  Grid,
} from "@mui/material";

// ICONS
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

// CONTEXTS
import { useFeedbacks } from "../../context/FeedbackContext";

function Feedbacks() {
  const { feedbacks } = useFeedbacks();

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        direction: "rtl",
        display: "flex",
        flexDirection: "column",
        justifyContent: "start",
        gap: 5,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "start",
          alignItems: "start",
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 800,
            mb: 0.2,
            color: "text.primary",
            textAlign: "start",
          }}
        >
          آراء وتقييمات العملاء
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{ color: "text.secondary", fontWeight: 600, textAlign: "start" }}
        >
          إجمالي التقييمات المستقبلة: {feedbacks.length}
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        {feedbacks.map((item) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
            <Card
              elevation={0}
              sx={{
                borderRadius: "16px",
                border: "1px solid",
                borderColor: "#e2e8f0",
                backgroundColor: "#ffffff",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: "0px 10px 25px -5px rgba(0, 0, 0, 0.05)",
                  borderColor: "#cbd5e1",
                },
              }}
            >
              <CardContent
                sx={{
                  p: 2.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  height: "100%",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{ alignItems: "center", gap: 1.2 }}
                  >
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: "10px",
                        bgcolor: "background.default",
                        color: "primary.main",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <TableRestaurantIcon fontSize="small" />
                    </Box>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: "700", color: "text.primary" }}
                    >
                      طاولة {item.table_number}
                    </Typography>
                  </Stack>

                  <Stack
                    direction="row"
                    sx={{
                      alignItems: "center",
                      gap: 0.5,
                      color: "text.secondary",
                    }}
                  >
                    <AccessTimeIcon sx={{ fontSize: 15 }} />
                    <Typography variant="caption" sx={{ fontWeight: "500" }}>
                      {item.created_at ? new Date(item.created_at).toLocaleDateString("ar-SA", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—"}
                    </Typography>
                  </Stack>
                </Box>

                <Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
                  <Rating
                    value={item.rating}
                    readOnly
                    precision={0.5}
                    size="small"
                    sx={{ color: "#f59e0b" }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: "700", color: "text.secondary" }}
                  >
                    ({item.rating}/5)
                  </Typography>
                </Box>

                {item.tags && item.tags.length > 0 && (
                  <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.8 }}>
                    {item.tags.map((tag, idx) => (
                      <Chip
                        key={idx}
                        label={tag}
                        size="small"
                        sx={{
                          borderRadius: "6px",
                          backgroundColor: "#f8fafc",
                          color: "#475569",
                          border: "1px solid #e2e8f0",
                          fontWeight: "500",
                          fontSize: "0.75rem",
                        }}
                      />
                    ))}
                  </Stack>
                )}

                {item.comment && (
                  <Box
                    sx={{
                      mt: "auto",
                      p: 1.8,
                      borderRadius: "10px",
                      backgroundColor: "#f8fafc",
                      borderRight: "3px solid #ff6b00",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        lineHeight: 1.6,
                        textAlign: "right",
                        color: "text.primary",
                      }}
                    >
                      "{item.comment}"
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Feedbacks;
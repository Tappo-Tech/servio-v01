import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

// Context
import { useTables } from "../../../context/TablesContext";

// MUI COMPONENTS
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";

// MUI ICONS
import QrCode2Icon from "@mui/icons-material/QrCode2";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import PrintIcon from "@mui/icons-material/Print";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

function QRCodeGenerate() {
  const { tables, generateTables, clearTables } = useTables();
  const [tablesCount, setTablesCount] = useState(tables.length || 5);

  const handleGenerate = (e) => {
    e.preventDefault();
    generateTables(tablesCount);
  };

  // طباعة الكل أو طباعة طاولة محددة
  const handlePrint = (tableId = null) => {
    if (tableId) {
      const singleCard = document.getElementById(`table-card-${tableId}`);
      if (singleCard) {
        singleCard.classList.add("print-single-target");
        window.print();
        singleCard.classList.remove("print-single-target");
        return;
      }
    }
    window.print();
  };

  return (
    <Box sx={{ pt: 1, maxWidth: 960, mx: "auto" }}>
      {/* CSS مخصص لإصلاح تباعد الأيقونات في RTL وضبط الطباعة */}
      <style>
        {`
          /* إصلاح مساحات الأيقونات في واجهات RTL */
          .MuiButton-startIcon {
            margin-left: 8px !important;
            margin-right: -4px !important;
          }

          /* إعدادات الطباعة */
          @media print {
            body {
              background: #fff !important;
            }
            body * {
              visibility: hidden;
            }
            #printable-area, #printable-area * {
              visibility: visible;
            }
            #printable-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
            /* طباعة طاولة واحدة فقط عند تحديدها */
            body.printing-single .qr-card:not(.print-single-target) {
              display: none !important;
            }
          }
        `}
      </style>

      {/* Header / Input Form */}
      <Paper
        variant="outlined"
        className="no-print"
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: "16px",
          mb: 3,
          backgroundColor: "background.paper",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "start", gap: 1.5, mb: 2 }}>
          <QrCode2Icon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography
              variant="h6"
              component="h1"
              sx={{
                fontWeight: 800,
                mb: 0.2,
                color: "text.primary",
                textAlign: "start",
              }}
            >
              توليد رموز QR للطاولات
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "text.secondary",
                fontWeight: 600,
                textAlign: "start",
              }}
            >
              حدّد عدد الطاولات لتوليد كود المنيو الخاص بكل طاولة تلقائياً
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box component="form" onSubmit={handleGenerate}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="إجمالي عدد الطاولات"
                value={tablesCount}
                onChange={(e) => setTablesCount(e.target.value)}
                size="small"
                slotProps={{
                  htmlInput: { min: 1, max: 100 },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <TableRestaurantIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                startIcon={<AddBoxOutlinedIcon />}
                sx={{ py: 1, fontWeight: 700, borderRadius: "8px", gap: 1 }}
              >
                توليد
              </Button>
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<DeleteOutlinedIcon />}
                onClick={clearTables}
                sx={{ py: 1, fontWeight: 700, borderRadius: "8px", gap: 1 }}
              >
                مسح الكل
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Generated Tables List */}
      {tables.length > 0 && (
        <Box id="printable-area">
          <Box
            className="no-print"
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              الطاولات المُنشأة ({tables.length})
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PrintIcon />}
              size="small"
              sx={{ borderRadius: "8px", fontWeight: 700, gap: 1 }}
              onClick={() => handlePrint()}
            >
              طباعة كل الكروت
            </Button>
          </Box>

          <Grid container spacing={2.5}>
            {tables.map((table) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={table.id}>
                <Card
                  id={`table-card-${table.id}`}
                  className="qr-card"
                  variant="outlined"
                  sx={{
                    borderRadius: "16px",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: "100%",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    pageBreakInside: "avoid",
                    p: 1,
                  }}
                >
                  <CardContent
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      p: 2,
                      "&:last-child": { pb: 2 },
                    }}
                  >
                    <Chip
                      label={`طاولة ${table.table_number}`}
                      color="primary"
                      sx={{
                        fontWeight: 700,
                        mb: 2,
                        fontSize: "14px",
                        px: 1,
                      }}
                    />

                    {/* الحاوية الخاصة بكود الـ QR */}
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "#fff",
                        borderRadius: "12px",
                        border: "1px solid",
                        borderColor: "grey.200",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <QRCodeSVG
                        value={table.qr_value}
                        size={150}
                        includeMargin={false}
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, mt: 2, color: "text.primary" }}
                    >
                      امسح الرمز لطلب المنيو
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "block",
                        width: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        mt: 0.5,
                        px: 1,
                      }}
                    >
                      {table.qr_value}
                    </Typography>
                  </CardContent>

                  <Divider className="no-print" sx={{ width: "100%" }} />

                  <CardActions
                    className="no-print"
                    sx={{ justifyContent: "center", w: "100%", py: 1 }}
                  >
                    <Button
                      size="small"
                      startIcon={<PrintIcon />}
                      onClick={() => handlePrint(table.id)}
                      sx={{ gap: 0.5 }}
                    >
                      طباعة
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}

export default QRCodeGenerate;

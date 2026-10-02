import { useState, useMemo } from "react";
import dayjs from "dayjs";

import InvoiceModal from "./OrderPill";

// CONTEXTS
import { useOrders } from "../../../context/OrdersContext";
import { useStore } from "../../../context/StoreInfoContext";
import { useLanguage } from "../../../context/LanguageContext";

// MUI COMPONENTS
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";

// ICONS
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

// DATE PICKER
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

const renderStatusChip = (status, t) => {
  const statusMap = {
    served: { label: t("managerServed"), color: "success" },
    unclaimed: { label: t("managerUnclaimed"), color: "warning" },
    cancelled: { label: t("managerCancelled"), color: "error" },
  };

  const config = statusMap[status] || { label: status, color: "default" };

  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 700 }}
    />
  );
};

function OrderRow({ order, currency, t }) {
  const [open, setOpen] = useState(false);
  const [openInvoice, setOpenInvoice] = useState(false);
  const shortOrderId = String(order.id || "").slice(-6).toUpperCase();

  return (
    <>
      <TableRow
        sx={{
          "& > *": { borderBottom: "unset" },
          "&:hover": { bgcolor: "rgba(244,121,32,.025)" },
        }}
      >
        <TableCell width={50}>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          <Chip
            label={`#${shortOrderId}`}
            size="small"
            sx={{
              borderRadius: 2,
              fontWeight: 900,
              bgcolor: "rgba(244,121,32,.08)",
              color: "primary.dark",
              letterSpacing: ".04em",
            }}
          />
        </TableCell>
        <TableCell align="center">{t("managerTable")} {order.table_number}</TableCell>
        <TableCell align="center">
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, color: "text.secondary", whiteSpace: "nowrap" }}
          >
            {dayjs(order.created_at).format("DD/MM/YY")}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "text.disabled", fontWeight: 700, display: "block" }}
          >
            {dayjs(order.created_at).format("hh:mm A")}
          </Typography>
        </TableCell>
        <TableCell align="center">{renderStatusChip(order.status, t)}</TableCell>
        <TableCell align="center" sx={{ fontWeight: 700 }}>
          {order.total_price} {currency}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1.5,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {t("managerItems")}
                </Typography>

                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ReceiptLongIcon />}
                  onClick={() => setOpenInvoice(true)}
                >
                  استعراض الفاتورة
                </Button>
              </Box>

              <Stack spacing={1} sx={{ mb: 2 }}>
                {order.items?.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      maxWidth: 400,
                      p: 1,
                      bgcolor: "action.hover",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2">
                      {item.name} × {item.quantity}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {item.price * item.quantity} {currency}
                    </Typography>
                  </Box>
                ))}
              </Stack>
              {order.notes && (
                <Typography variant="caption" color="text.secondary" display="block">
                  {t("managerNotes")}: {order.notes}
                </Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>

      <InvoiceModal
        open={openInvoice}
        onClose={() => setOpenInvoice(false)}
        order={order}
      />
    </>
  );
}

function OrdersHistory() {
  const { t } = useLanguage();
  const { orders = [] } = useOrders();
  const { storeInfo } = useStore();
  const currency = storeInfo?.currency || t("currencySar");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => order.is_completed)
      .filter((order) => {
        const matchesSearch =
          String(order.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(order.table_number).includes(searchQuery);

        const matchesStatus =
          statusFilter === "all" ? true : order.status === statusFilter;

        const matchesDate = selectedDate
          ? dayjs(order.created_at).isSame(selectedDate, "day")
          : true;

        return matchesSearch && matchesStatus && matchesDate;
      });
  }, [orders, searchQuery, statusFilter, selectedDate]);

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <TextField
          placeholder={t("managerHistorySearch")}
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: { xs: "100%", sm: 280 } }}
        />

        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            flexWrap: "wrap",
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="status-filter-label">{t("managerStatus")}</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label={t("managerStatus")}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">{t("managerAllStatuses")}</MenuItem>
              <MenuItem value="served">{t("managerServed")}</MenuItem>
              <MenuItem value="unclaimed">{t("managerUnclaimed")}</MenuItem>
              <MenuItem value="cancelled">{t("managerCancelled")}</MenuItem>
            </Select>
          </FormControl>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label={t("managerDate")}
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              format="YYYY/MM/DD"
              slotProps={{
                field: { clearable: true, onClear: () => setSelectedDate(null) },
                textField: {
                  size: "small",
                  InputLabelProps: { shrink: true },
                  sx: {
                    width: { xs: "100%", sm: 220 },
                  },
                },
              }}
            />
          </LocalizationProvider>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: { xs: 2.5, md: 3.5 }, boxShadow: "0 14px 40px rgba(23,26,47,.055)", border: "1px solid rgba(255,255,255,.75)", overflow: "hidden" }}>
        <Table>
          <TableHead sx={{ bgcolor: "action.hover" }}>
            <TableRow>
              <TableCell width={50} />
              <TableCell sx={{ fontWeight: 700 }}>{t("managerOrderNumber")}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                {t("managerTable")}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                {t("managerDateTime")}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                {t("managerStatus")}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                {t("managerTotal")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <OrderRow key={order.id} order={order} currency={currency} t={t} />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {t("managerNoMatches")}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default OrdersHistory;
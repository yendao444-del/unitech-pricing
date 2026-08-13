import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { check as checkForUpdate } from "@tauri-apps/plugin-updater";
import html2pdf from "html2pdf.js";
import dbyLogo from "./assets/dby-logo-navbar.png";
import {
  ArrowRight,
  ArrowsCounterClockwise,
  Barcode,
  Building,
  Calculator,
  CaretDown,
  Check,
  CirclesFour,
  Copy,
  Cube,
  Cylinder,
  Download,
  Envelope,
  FilePdf,
  FileText,
  FloppyDisk,
  Funnel,
  Gear,
  House,
  Info,
  MagnifyingGlass,
  MapPin,
  Package,
  Pencil,
  Phone,
  Plus,
  Printer,
  Ruler,
  Scissors,
  Stack,
  Storefront,
  Tag,
  ToiletPaper,
  Trash,
  User,
  UserPlus,
  UsersThree,
  WarningCircle,
  Wrench,
  X,
} from "@phosphor-icons/react";

const money = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
const parseMoneyInput = (value) =>
  Number(String(value ?? "").replace(/[^0-9-]/g, "")) || 0;
const formatMoneyInput = (value) => {
  const numericValue = parseMoneyInput(value);
  return value === "" || value == null ? "" : money.format(numericValue);
};
const updatePreviewStatus =
  import.meta.env.DEV && typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("update-preview") || ""
    : "";
const fmt = (value) =>
  `${money.format(Math.max(0, Math.ceil(value / 1000) * 1000))} đ`;

const PRINT_PAPER_SIZES = {
  a4: { label: "A4 · 210 × 297 mm", jsPdfFormat: "a4", previewWidth: 794 },
  a5: { label: "A5 · 148 × 210 mm", jsPdfFormat: "a5", previewWidth: 559 },
  a6: { label: "A6 · 105 × 148 mm", jsPdfFormat: "a6", previewWidth: 397 },
};

const DEFAULT_SUPPLIER_PRICES = [
  {
    id: "sp-1",
    supplier: "Avery Dennison (Fasson)",
    code: "BW0153",
    name: "Decal Fasson AW0331 Gloss White / Keo Ak13",
    paperPrice: 8500,
    unit: "VND/m²",
    note: "Khổ cuộn 1000mm, hàng phổ thông",
    updatedAt: "2024-05-10",
  },
  {
    id: "sp-2",
    supplier: "Avery Dennison (Fasson)",
    code: "BW0143",
    name: "Decal cảm nhiệt trực tiếp Direct Thermal",
    paperPrice: 9200,
    unit: "VND/m²",
    note: "Không dùng mực ribbon, nhạy nhiệt cao",
    updatedAt: "2024-05-12",
  },
  {
    id: "sp-3",
    supplier: "Lintec Vietnam",
    code: "K2441",
    name: "Decal nhựa PP Trắng bóng / Keo dính cao",
    paperPrice: 14000,
    unit: "VND/m²",
    note: "Chống nước, xé không rách, dán chai lọ",
    updatedAt: "2024-04-20",
  },
  {
    id: "sp-4",
    supplier: "UPM Raflatac",
    code: "VEL-TTR",
    name: "Decal Vellum TTR / Keo nước RP51",
    paperPrice: 7800,
    unit: "VND/m²",
    note: "Decal giấy mờ in ribbon Wax bám mực tốt",
    updatedAt: "2024-05-01",
  },
  {
    id: "sp-5",
    supplier: "Oji Paper",
    code: "OJI-TD80",
    name: "Decal màng cảm nhiệt trực tiếp 80g",
    paperPrice: 10500,
    unit: "VND/m²",
    note: "Chuyên in tem đơn hàng, phiếu giao hàng",
    updatedAt: "2024-05-15",
  },
  {
    id: "sp-6",
    supplier: "Công ty Giấy Hóa Sen",
    code: "HS-SILVER",
    name: "Decal xi bạc (Matte Silver PET)",
    paperPrice: 22000,
    unit: "VND/m²",
    note: "Tem nhãn thiết bị điện tử, máy móc cao cấp",
    updatedAt: "2024-05-08",
  },
];

const DEFAULT_CUSTOMERS = [
  {
    id: "cust-1",
    code: "KH-001",
    name: "CÔNG TY TRÁCH NHIỆM HỮU HẠN MỘT THÀNH VIÊN SEDO VINAKO",
    shortName: "SEDO VINAKO",
    address: "Thôn Đông Yên, Xã Duy Xuyên, TP Đà Nẵng, Việt Nam",
    email: "contact@sedovinako.com",
    phone: "0236.3888.999",
    contactPerson: "Anh Hùng - Phòng Mua hàng",
    taxCode: "0401889988",
    type: "Doanh nghiệp",
  },
  {
    id: "cust-2",
    code: "KH-002",
    name: "CÔNG TY TNHH CANON VIỆT NAM",
    shortName: "Canon Việt Nam",
    address: "KCN Thăng Long, Huyện Đông Anh, TP. Hà Nội",
    email: "purchasing@canon-vn.com.vn",
    phone: "024.3881.1222",
    contactPerson: "Chị Thảo - Kế toán kho",
    taxCode: "0101156677",
    type: "Doanh nghiệp",
  },
  {
    id: "cust-3",
    code: "KH-003",
    name: "TẬP ĐOÀN FOXCONN VIỆT NAM",
    shortName: "Foxconn Bắc Giang",
    address: "KCN Quang Châu, Huyện Việt Yên, Tỉnh Bắc Giang",
    email: "procurement@foxconn.com.vn",
    phone: "0204.3858.888",
    contactPerson: "Mr. Lee - Quản lý Vật tư",
    taxCode: "2400399888",
    type: "Doanh nghiệp",
  },
  {
    id: "cust-4",
    code: "KH-004",
    name: "CÔNG TY CỔ PHẦN SỮA VIỆT NAM (VINAMILK)",
    shortName: "Vinamilk",
    address: "Số 10 Đường Tân Trào, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh",
    email: "vinamilk@vinamilk.com.vn",
    phone: "028.5415.5555",
    contactPerson: "Anh Nam - Phòng Bao bì",
    taxCode: "0300588565",
    type: "Doanh nghiệp",
  },
];

const DEFAULT_QUOTE_TERMS = [
  "Báo giá này có hiệu lực trong vòng 30 ngày kể từ ngày báo giá",
  "Thời hạn thanh toán: Sau 30 ngày kể từ ngày xuất hóa đơn",
  "Miễn phí vận chuyển đến kho bên mua",
  "Thời gian giao hàng: 3-5 ngày kể từ khi nhận được đơn đặt hàng",
  "Mọi thắc mắc về chất lượng của sản phẩm vui lòng liên hệ trực tiếp phòng kinh doanh Mrs Ngân '0961453395",
  "Rất mong có cơ hội được phục vụ quý khách hàng. Xin chân thành cảm ơn!",
];
export function App() {
  const appWindow = useMemo(() => {
    if (typeof window !== "undefined" && window.__TAURI_INTERNALS__) {
      try {
        return getCurrentWindow();
      } catch (e) {}
    }
    return {
      minimize: () => {},
      toggleMaximize: () => {},
      close: () => {},
      startDragging: () => {},
    };
  }, []);

  const handleWindowDrag = (event) => {
    if (
      event.button !== 0 ||
      event.target.closest("button") ||
      !window.__TAURI_INTERNALS__
    )
      return;
    try {
      if (appWindow && typeof appWindow.startDragging === "function") {
        appWindow.startDragging();
      }
    } catch (e) {}
  };

  // Main UI states
  const [width, setWidth] = useState("");
  const [length, setLength] = useState("");
  const [labelsPerRoll, setLabelsPerRoll] = useState("");
  const [meters, setMeters] = useState("");
  const [paperPrice, setPaperPrice] = useState("");
  const [processing, setProcessing] = useState("");
  const [profitPercent, setProfitPercent] = useState("");
  const [profitAmount, setProfitAmount] = useState("");
  const [profitMode, setProfitMode] = useState("percent");
  const [quantity, setQuantity] = useState("");
  const [mode, setMode] = useState("roll");
  const [category, setCategory] = useState("tem");
  const [activeMenu, setActiveMenu] = useState("tem");
  const [formula, setFormula] = useState("tem-known-meters");
  const [saved, setSaved] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(
    updatePreviewStatus || "idle",
  );
  const [updateMessage, setUpdateMessage] = useState(
    updatePreviewStatus
      ? updatePreviewStatus === "installing"
        ? "Đã tải xong. Đang cài đặt; ứng dụng sẽ tự đóng và mở lại..."
        : updatePreviewStatus === "installed"
          ? "Đã cài đặt bản cập nhật. Đang khởi động lại ứng dụng..."
          : "Đang tải bản cập nhật an toàn từ GitHub. Vui lòng giữ ứng dụng mở."
      : "",
  );
  const [updateProgress, setUpdateProgress] = useState(
    updatePreviewStatus === "downloading"
      ? 64
      : ["installing", "installed"].includes(updatePreviewStatus)
        ? 100
        : 0,
  );
  const [updateTargetVersion, setUpdateTargetVersion] = useState(
    updatePreviewStatus ? "0.1.15" : "",
  );
  const [appVersion, setAppVersion] = useState("0.1.8");
  const [backendCalc, setBackendCalc] = useState(null);
  const [backendPieceCalc, setBackendPieceCalc] = useState(null);
  const [backendRollByCountCalc, setBackendRollByCountCalc] = useState(null);

  const handleCheckForUpdates = async () => {
    if (!window.__TAURI_INTERNALS__) {
      setUpdateStatus("unavailable");
      setUpdateMessage("Kiểm tra cập nhật chỉ hoạt động trong bản cài đặt Unitech Pricing.");
      return;
    }

    setUpdateProgress(0);
    setUpdateTargetVersion("");
    setUpdateStatus("checking");
    setUpdateMessage("Đang kết nối tới máy chủ cập nhật...");
    try {
      const update = await checkForUpdate();
      if (!update) {
        setUpdateStatus("current");
        setUpdateMessage("Bạn đang dùng phiên bản mới nhất.");
        return;
      }

      let downloadedBytes = 0;
      let totalBytes = 0;
      setUpdateTargetVersion(update.version);
      setUpdateStatus("downloading");
      setUpdateMessage(`Đang tải DBY Label Pricing v${update.version}...`);
      localStorage.setItem(
        "dby_update_pending",
        JSON.stringify({ version: update.version, startedAt: Date.now() }),
      );

      // Give React enough time to paint the blocking update screen before the
      // native installer takes control and closes the current window.
      await new Promise((resolve) => setTimeout(resolve, 250));
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          totalBytes = event.data.contentLength || 0;
          downloadedBytes = 0;
          setUpdateProgress(0);
          return;
        }
        if (event.event === "Progress") {
          downloadedBytes += event.data.chunkLength;
          if (totalBytes > 0) {
            setUpdateProgress(
              Math.min(99, Math.round((downloadedBytes / totalBytes) * 100)),
            );
          }
          return;
        }
        if (event.event === "Finished") {
          setUpdateProgress(100);
          setUpdateStatus("installing");
          setUpdateMessage(
            "Đã tải xong. Đang cài đặt; ứng dụng sẽ tự đóng và mở lại...",
          );
        }
      });
      setUpdateStatus("installed");
      setUpdateMessage("Đã cài đặt bản cập nhật. Đang khởi động lại ứng dụng...");
    } catch (error) {
      console.error("Update check failed:", error);
      localStorage.removeItem("dby_update_pending");
      setUpdateStatus("error");
      setUpdateMessage("Chưa thể kiểm tra cập nhật. Vui lòng thử lại sau.");
    }
  };

  // Subtab for Khách hàng & Giá nhập module
  const [khachHangSubTab, setKhachHangSubTab] = useState("customers"); // "customers" | "supplier-prices"
  // A quotation editor is opened only after the user explicitly creates or
  // resumes a draft.  The Báo giá module otherwise shows its waiting screen.
  const [hasActiveQuoteDraft, setHasActiveQuoteDraft] = useState(false);

  // Subtab for Báo giá module
  const [baoGiaSubTab, setBaoGiaSubTab] = useState("editor"); // "editor" | "history"

  // Master Data: Supplier Paper Prices
  const [supplierPrices, setSupplierPrices] = useState(() => {
    try {
      const saved = localStorage.getItem("unitech_supplier_prices");
      const records = saved ? JSON.parse(saved) : [];
      return records.length > 0 ? records : DEFAULT_SUPPLIER_PRICES;
    } catch (e) {
      return DEFAULT_SUPPLIER_PRICES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        "unitech_supplier_prices",
        JSON.stringify(supplierPrices),
      );
    } catch (e) {}
  }, [supplierPrices]);

  // Master Data: Customer Contacts
  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem("unitech_customers");
      const records = saved ? JSON.parse(saved) : [];
      return records.length > 0 ? records : DEFAULT_CUSTOMERS;
    } catch (e) {
      return DEFAULT_CUSTOMERS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("unitech_customers", JSON.stringify(customers));
    } catch (e) {}
  }, [customers]);

  // Saved Quotations history
  const [savedQuotes, setSavedQuotes] = useState(() => {
    try {
      const saved = localStorage.getItem("unitech_saved_quotes");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("unitech_saved_quotes", JSON.stringify(savedQuotes));
    } catch (e) {}
  }, [savedQuotes]);

  // Current Quotation Draft State
  const [currentQuote, setCurrentQuote] = useState({
    id: `quote-${Date.now()}`,
    quoteNo: "",
    quoteDate: new Date().toLocaleDateString("vi-VN"),
    customerName: "",
    customerAddress: "",
    customerEmail: "",
    customerPhone: "",
    salesName: "",
    salesPhone: "",
    salesEmail: "",
    vatRate: 8,
    items: [],
    terms: [],
  });

  // UI Toast state
  const [toastMsg, setToastMsg] = useState(null);
  const [toastAction, setToastAction] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Đồng ý",
    confirmVariant: "danger",
    onConfirm: null,
  });
  const showToast = (msg, action = null) => {
    setToastMsg(msg);
    setToastAction(action);
    setTimeout(() => {
      setToastMsg(null);
      setToastAction(null);
    }, 4000);
  };

  const askConfirm = ({
    title,
    message,
    confirmText = "Đồng ý",
    confirmVariant = "danger",
    onConfirm,
  }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      confirmVariant,
      onConfirm,
    });
  };

  const createBlankQuote = () => ({
    id: `quote-${Date.now()}`,
    quoteNo: `BG-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    quoteDate: new Date().toLocaleDateString("vi-VN"),
    customerName: "",
    customerAddress: "",
    customerEmail: "",
    customerPhone: "",
    salesName: "",
    salesPhone: "",
    salesEmail: "",
    vatRate: 8,
    items: [],
    terms: [],
  });

  // Supplier Price Form states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("ALL");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedPaperCode, setSelectedPaperCode] = useState("");
  const [formSupplier, setFormSupplier] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formPaperPrice, setFormPaperPrice] = useState("");
  const [formNote, setFormNote] = useState("");

  const resetForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormSupplier("");
    setFormCode("");
    setFormName("");
    setFormPaperPrice("");
    setFormNote("");
  };

  // Customer Form States
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [formCustCode, setFormCustCode] = useState("");
  const [formCustName, setFormCustName] = useState("");
  const [formCustShortName, setFormCustShortName] = useState("");
  const [formCustAddress, setFormCustAddress] = useState("");
  const [formCustEmail, setFormCustEmail] = useState("");
  const [formCustPhone, setFormCustPhone] = useState("");
  const [formCustContact, setFormCustContact] = useState("");
  const [formCustTax, setFormCustTax] = useState("");

  const resetCustomerForm = () => {
    setShowCustomerForm(false);
    setEditingCustomerId(null);
    setFormCustCode("");
    setFormCustName("");
    setFormCustShortName("");
    setFormCustAddress("");
    setFormCustEmail("");
    setFormCustPhone("");
    setFormCustContact("");
    setFormCustTax("");
  };

  // Print Preview Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printPaperSize, setPrintPaperSize] = useState("a4");
  const [isPrintSizeMenuOpen, setIsPrintSizeMenuOpen] = useState(false);
  // A calculator preview is deliberately kept separate from the quotation
  // draft.  Sales can inspect the PDF without silently adding an item or
  // being taken away from the calculator.
  const [printPreviewQuote, setPrintPreviewQuote] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (showAddForm) resetForm();
        if (showCustomerForm) resetCustomerForm();
        if (showPrintModal) {
          setShowPrintModal(false);
          setPrintPreviewQuote(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAddForm, showCustomerForm, showPrintModal]);

  useEffect(() => {
    if (!window.__TAURI_INTERNALS__) return;
    getVersion()
      .then((version) => {
        setAppVersion(version);
        try {
          const pending = JSON.parse(
            localStorage.getItem("dby_update_pending") || "null",
          );
          if (pending?.version === version) {
            localStorage.removeItem("dby_update_pending");
            setTimeout(
              () => showToast(`Cập nhật thành công DBY Label Pricing v${version}`),
              350,
            );
          }
        } catch (error) {
          localStorage.removeItem("dby_update_pending");
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveSupplierPrice = (e) => {
    e.preventDefault();
    if (!formSupplier.trim() || !formCode.trim() || !formPaperPrice) {
      alert("Vui lòng điền đầy đủ Tên nhà cung cấp, Mã loại giấy và Đơn giá!");
      return;
    }
    const priceNum = parseMoneyInput(formPaperPrice);
    const now = new Date().toLocaleDateString("vi-VN");

    if (editingId) {
      setSupplierPrices((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                supplier: formSupplier.trim(),
                code: formCode.trim().toUpperCase(),
                name: formName.trim() || formCode.trim(),
                paperPrice: priceNum,
                note: formNote.trim(),
                updatedAt: now,
              }
            : item,
        ),
      );
      showToast(`Đã cập nhật đơn giá giấy cho mã ${formCode.toUpperCase()}`);
    } else {
      const newItem = {
        id: `sp-${Date.now()}`,
        supplier: formSupplier.trim(),
        code: formCode.trim().toUpperCase(),
        name: formName.trim() || formCode.trim(),
        paperPrice: priceNum,
        unit: "VND/m²",
        note: formNote.trim(),
        updatedAt: now,
      };
      setSupplierPrices((prev) => [newItem, ...prev]);
      showToast(`Đã thêm mã giấy ${newItem.code} của ${newItem.supplier}`);
    }
    resetForm();
  };

  const handleEditSupplier = (item) => {
    setEditingId(item.id);
    setFormSupplier(item.supplier);
    setFormCode(item.code);
    setFormName(item.name);
    setFormPaperPrice(formatMoneyInput(item.paperPrice));
    setFormNote(item.note || "");
    setShowAddForm(true);
  };

  const handleDeleteSupplier = (id, code) => {
    askConfirm({
      title: "Xóa mã giá nhập NCC",
      message: `Bạn có chắc chắn muốn xóa mã giấy ${code} khỏi bảng giá nhập không?`,
      confirmText: "Xóa mã giấy",
      onConfirm: () => {
        setSupplierPrices((prev) => prev.filter((i) => i.id !== id));
        showToast(`Đã xóa mã giấy ${code}`);
      },
    });
  };

  const handleApplyToCalculator = (item) => {
    setPaperPrice(formatMoneyInput(item.paperPrice));
    setSelectedPaperCode(item.code);
    setActiveMenu("tem");
    setCategory("tem");
    showToast(
      `Đã áp dụng Giá giấy: ${money.format(item.paperPrice)} VND/m² (${item.supplier} - ${item.code}) vào bảng tính!`,
    );
  };

  const handleSaveCustomer = (e) => {
    e.preventDefault();
    if (!formCustName.trim()) {
      showToast("⚠️ Vui lòng nhập Tên công ty / Tên khách hàng!");
      return;
    }
    if (editingCustomerId) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === editingCustomerId
            ? {
                ...c,
                code: formCustCode.trim() || c.code,
                name: formCustName.trim(),
                shortName: formCustShortName.trim() || formCustName.trim(),
                address: formCustAddress.trim(),
                email: formCustEmail.trim(),
                phone: formCustPhone.trim(),
                contactPerson: formCustContact.trim(),
                taxCode: formCustTax.trim(),
              }
            : c,
        ),
      );
      showToast(`Đã cập nhật thông tin khách hàng ${formCustName}`);
    } else {
      const newCust = {
        id: `cust-${Date.now()}`,
        code:
          formCustCode.trim() || `KH-${Math.floor(100 + Math.random() * 900)}`,
        name: formCustName.trim(),
        shortName: formCustShortName.trim() || formCustName.trim(),
        address: formCustAddress.trim(),
        email: formCustEmail.trim(),
        phone: formCustPhone.trim(),
        contactPerson: formCustContact.trim(),
        taxCode: formCustTax.trim(),
        type: "Doanh nghiệp",
      };
      setCustomers((prev) => [newCust, ...prev]);
      showToast(`Đã thêm khách hàng ${newCust.name} vào danh bạ`);
    }
    resetCustomerForm();
  };

  const handleEditCustomer = (cust) => {
    setEditingCustomerId(cust.id);
    setFormCustCode(cust.code || "");
    setFormCustName(cust.name || "");
    setFormCustShortName(cust.shortName || "");
    setFormCustAddress(cust.address || "");
    setFormCustEmail(cust.email || "");
    setFormCustPhone(cust.phone || "");
    setFormCustContact(cust.contactPerson || "");
    setFormCustTax(cust.taxCode || "");
    setShowCustomerForm(true);
  };

  const handleDeleteCustomer = (id, name) => {
    askConfirm({
      title: "Xóa Khách hàng khỏi Danh bạ",
      message: `Bạn có chắc chắn muốn xóa khách hàng "${name}" khỏi danh bạ không?`,
      confirmText: "Xóa khách hàng",
      onConfirm: () => {
        setCustomers((prev) => prev.filter((c) => c.id !== id));
        showToast(`Đã xóa khách hàng khỏi danh bạ`);
      },
    });
  };

  const handleSelectCustomerForQuote = (cust) => {
    setCurrentQuote((prev) => ({
      ...prev,
      customerName: cust.name,
      customerAddress: cust.address,
      customerEmail: cust.email,
      customerPhone: cust.phone,
    }));
    setActiveMenu("bao-gia");
    setCategory("bao-gia");
    setBaoGiaSubTab("editor");
    showToast(
      `Đã chọn Khách hàng "${cust.shortName || cust.name}" cho Báo giá`,
    );
  };

  // Computed properties
  const suppliersList = useMemo(() => {
    const set = new Set(supplierPrices.map((i) => i.supplier));
    return Array.from(set);
  }, [supplierPrices]);

  const filteredPrices = useMemo(() => {
    return supplierPrices.filter((item) => {
      const matchSupplier =
        filterSupplier === "ALL" || item.supplier === filterSupplier;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.supplier.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        (item.note && item.note.toLowerCase().includes(q));
      return matchSupplier && matchQuery;
    });
  }, [supplierPrices, filterSupplier, searchQuery]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearchQuery.toLowerCase().trim();
    return customers.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.shortName && c.shortName.toLowerCase().includes(q)) ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q)),
    );
  }, [customers, customerSearchQuery]);

  const stats = useMemo(() => {
    const countSuppliers = suppliersList.length;
    const countItems = supplierPrices.length;
    if (countItems === 0)
      return {
        countSuppliers: 0,
        countItems: 0,
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
      };
    const prices = supplierPrices.map((i) => i.paperPrice);
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / countItems);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    return { countSuppliers, countItems, avgPrice, minPrice, maxPrice };
  }, [supplierPrices, suppliersList]);

  // Pricing calculations
  const calc = useMemo(() => {
    const w = Number(width) || 0;
    const m = Number(meters) || 0;
    const p = parseMoneyInput(paperPrice);
    const extraFee =
      formula === "tem-one-color"
        ? 5000
        : formula === "tem-two-color"
          ? 7000
          : formula === "tem-laminated"
            ? 11000
            : 0;
    const fee = parseMoneyInput(processing) + extraFee;
    const q = Number(quantity) || 0;
    const usefulWidth = (w + 5) / 1000;
    const area = usefulWidth * m;
    const paper = area * p;
    const unit = paper + fee;
    const rolls = mode === "roll" ? q : Math.ceil(q / 1000);
    return {
      usefulWidth,
      area,
      paper,
      fee,
      extraFee,
      unit,
      rolls,
      order: unit * rolls,
    };
  }, [width, meters, paperPrice, processing, quantity, mode, formula]);

  useEffect(() => {
    if (
      !window.__TAURI_INTERNALS__ ||
      mode !== "roll" ||
      category !== "tem" ||
      ![
        "tem-known-meters",
        "tem-one-color",
        "tem-two-color",
        "tem-laminated",
      ].includes(formula)
    )
      return;
    invoke("calculate_white_roll_quote", {
      input: {
        widthMm: Number(width) || 0,
        meters: Number(meters) || 0,
        paperPrice: parseMoneyInput(paperPrice),
        processingFee:
          parseMoneyInput(processing) +
          (formula === "tem-one-color"
            ? 5000
            : formula === "tem-two-color"
              ? 7000
              : formula === "tem-laminated"
                ? 11000
                : 0),
        quantity: Number(quantity) || 0,
      },
    })
      .then(setBackendCalc)
      .catch(() => setBackendCalc(null));
  }, [
    width,
    meters,
    paperPrice,
    processing,
    quantity,
    mode,
    category,
    formula,
  ]);

  const displayCalc = backendCalc ?? calc;

  const salesPricing = useMemo(() => {
    const productionCost = displayCalc.unitCost ?? displayCalc.unit ?? 0;
    const percent = profitMode === "percent" ? Number(profitPercent) || 0 : 0;
    const fixedAmount = profitMode === "amount" ? Number(profitAmount) || 0 : 0;
    const percentProfit = (productionCost * percent) / 100;
    const totalProfit = percentProfit + fixedAmount;
    const salePrice = Math.ceil((productionCost + totalProfit) / 1000) * 1000;
    return {
      productionCost,
      percent,
      fixedAmount,
      percentProfit,
      totalProfit,
      salePrice,
    };
  }, [displayCalc, profitPercent, profitAmount, profitMode]);

  const pieceCalc = useMemo(() => {
    const w = Number(width) || 0;
    const l = Number(length) || 0;
    const p = parseMoneyInput(paperPrice);
    const fee = parseMoneyInput(processing);
    const q = Number(quantity) || 0;
    const area = (w * l) / 1_000_000;
    const rate = p + fee;
    const unit = Math.ceil(area * rate);
    return {
      area,
      rate,
      unit,
      quantity: q,
      order: Math.ceil((unit * q) / 1000) * 1000,
    };
  }, [width, length, paperPrice, processing, quantity]);

  useEffect(() => {
    if (
      !window.__TAURI_INTERNALS__ ||
      category !== "tem" ||
      formula !== "tem-piece"
    )
      return;
    invoke("calculate_label_piece_quote", {
      input: {
        widthMm: Number(width) || 0,
        lengthMm: Number(length) || 0,
        paperPrice: parseMoneyInput(paperPrice),
        processingFee: parseMoneyInput(processing),
        quantity: Number(quantity) || 0,
      },
    })
      .then(setBackendPieceCalc)
      .catch(() => setBackendPieceCalc(null));
  }, [width, length, paperPrice, processing, quantity, category, formula]);

  const displayPieceCalc = backendPieceCalc ?? pieceCalc;

  const rollByCountCalc = useMemo(() => {
    const w = Number(width) || 0;
    const h = Number(length) || 0;
    const labels = Number(labelsPerRoll) || 0;
    const p = parseMoneyInput(paperPrice);
    const fee = parseMoneyInput(processing);
    const q = Number(quantity) || 0;
    const derivedMeters = ((h + 3) / 1000) * labels;
    const usefulWidth = (w + 5) / 1000;
    const area = usefulWidth * derivedMeters;
    const paper = area * p;
    const unit = Math.ceil((paper + fee) / 1000) * 1000;
    return {
      derivedMeters,
      usefulWidth,
      area,
      paper,
      fee,
      unit,
      quantity: q,
      order: unit * q,
    };
  }, [width, length, labelsPerRoll, paperPrice, processing, quantity]);

  useEffect(() => {
    if (
      !window.__TAURI_INTERNALS__ ||
      category !== "tem" ||
      formula !== "tem-roll-quantity"
    )
      return;
    invoke("calculate_label_roll_by_count_quote", {
      input: {
        widthMm: Number(width) || 0,
        heightMm: Number(length) || 0,
        labelsPerRoll: Number(labelsPerRoll) || 0,
        paperPrice: parseMoneyInput(paperPrice),
        processingFee: parseMoneyInput(processing),
        quantity: Number(quantity) || 0,
      },
    })
      .then(setBackendRollByCountCalc)
      .catch(() => setBackendRollByCountCalc(null));
  }, [
    width,
    length,
    labelsPerRoll,
    paperPrice,
    processing,
    quantity,
    category,
    formula,
  ]);

  const displayRollByCountCalc = backendRollByCountCalc ?? rollByCountCalc;

  const cleanBienText = (str) => {
    if (!str) return "";
    return str
      .replace(/\s*\(\s*Biên\s*\+5mm\s*\)/gi, "")
      .replace(/\s*\(Biên\s*\+5mm[^\)]*\)/gi, "")
      .trim();
  };

  // Quotation line item totals
  const quoteSubtotal = useMemo(() => {
    return currentQuote.items.reduce(
      (sum, item) => sum + (Number(item.totalPrice) || 0),
      0,
    );
  }, [currentQuote.items]);

  const quoteVatAmount = useMemo(() => {
    return Math.round(
      (quoteSubtotal * (Number(currentQuote.vatRate) || 0)) / 100,
    );
  }, [quoteSubtotal, currentQuote.vatRate]);

  const quoteGrandTotal = useMemo(() => {
    return quoteSubtotal + quoteVatAmount;
  }, [quoteSubtotal, quoteVatAmount]);

  const quoteForPrint = printPreviewQuote ?? currentQuote;
  const printSubtotal = useMemo(
    () => quoteForPrint.items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0),
    [quoteForPrint.items],
  );
  const printVatAmount = useMemo(
    () => Math.round((printSubtotal * (Number(quoteForPrint.vatRate) || 0)) / 100),
    [printSubtotal, quoteForPrint.vatRate],
  );
  const printGrandTotal = printSubtotal + printVatAmount;
  const activePaperSize = PRINT_PAPER_SIZES[printPaperSize];

  // Builds an item without changing the quotation draft or the current page.
  const buildCalculatedQuoteItem = () => {
    let newItem = null;
    if (
      [
        "tem-known-meters",
        "tem-one-color",
        "tem-two-color",
        "tem-laminated",
      ].includes(formula)
    ) {
      // Only the final sale price leaves the internal calculator.  Margin
      // inputs and production cost must never be persisted in a quotation.
      const uPrice = salesPricing.salePrice;
      const q = Number(quantity) || 1;
      newItem = {
        id: `item-${Date.now()}`,
        stt: currentQuote.items.length + 1,
        pn: `TEM-${width}x${length}-${meters}M`,
        desc: `${formula === "tem-one-color" ? "Tem in 1 màu" : formula === "tem-two-color" ? "Tem in nhiều màu" : formula === "tem-laminated" ? "Tem màu cán màng" : "Cuộn tem nhãn theo mét"} ${width} × ${length} mm · dài ${meters} m/cuộn`,
        quantity: q,
        unit: mode === "roll" ? "Cuộn" : "Tem",
        unitPrice: uPrice,
        totalPrice: uPrice * q,
      };
    } else if (formula === "tem-piece") {
      const uPrice = displayPieceCalc.unitCost ?? displayPieceCalc.unit ?? 0;
      const q = Number(quantity) || 1;
      newItem = {
        id: `item-${Date.now()}`,
        stt: currentQuote.items.length + 1,
        pn: `TEM-${width}x${length}`,
        desc: `Tem nhãn 1 chiếc ${width}mm × ${length}mm`,
        quantity: q,
        unit: "Tem",
        unitPrice: uPrice,
        totalPrice:
          displayPieceCalc.orderCost ?? displayPieceCalc.order ?? uPrice * q,
      };
    } else if (formula === "tem-roll-quantity") {
      const uPrice =
        displayRollByCountCalc.unitCost ?? displayRollByCountCalc.unit ?? 0;
      const q = Number(quantity) || 1;
      newItem = {
        id: `item-${Date.now()}`,
        stt: currentQuote.items.length + 1,
        pn: `TEM-${width}x${length}-${labelsPerRoll}L`,
        desc: `Cuộn tem ${width}x${length}mm (${labelsPerRoll} tem/cuộn)`,
        quantity: q,
        unit: "Cuộn",
        unitPrice: uPrice,
        totalPrice: uPrice * q,
      };
    }

    return newItem;
  };

  // Persisting is an explicit action: it is the only path that opens Báo giá.
  const handleAddCalcToQuote = () => {
    const newItem = buildCalculatedQuoteItem();
    if (newItem) {
      setCurrentQuote((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
      setHasActiveQuoteDraft(true);
      setActiveMenu("bao-gia");
      setCategory("bao-gia");
      setBaoGiaSubTab("editor");
      showToast(`Đã thêm ${newItem.desc} vào Bảng Báo Giá!`);
    }
  };

  const handlePreviewCalculationPdf = () => {
    const newItem = buildCalculatedQuoteItem();
    setPrintPreviewQuote(
      newItem
        ? { ...currentQuote, items: [...currentQuote.items, newItem] }
        : currentQuote,
    );
    setShowPrintModal(true);
  };

  const closePrintPreview = () => {
    setShowPrintModal(false);
    setPrintPreviewQuote(null);
  };

  const handleSaveQuoteToHistory = () => {
    if (currentQuote.items.length === 0) {
      showToast("Báo giá chưa có dòng sản phẩm để lưu.");
      return;
    }
    const newRecord = {
      ...currentQuote,
      subtotal: quoteSubtotal,
      vatAmount: quoteVatAmount,
      grandTotal: quoteGrandTotal,
      savedAt: new Date().toLocaleString("vi-VN"),
    };
    setSavedQuotes((prev) => [
      newRecord,
      ...prev.filter((q) => q.id !== currentQuote.id),
    ]);
    setCurrentQuote(createBlankQuote());
    setHasActiveQuoteDraft(false);
    showToast(`Đã lưu Báo giá ${currentQuote.quoteNo} vào Lịch sử và kết thúc bản nháp.`);
    setBaoGiaSubTab("history");
  };

  const handleCancelDraft = () => {
    if (currentQuote.items.length === 0 && !currentQuote.customerName) {
      showToast("Bản nháp hiện đang trống.");
      return;
    }

    askConfirm({
      title: "Hủy bản nháp báo giá",
      message: "Các thông tin và dòng hàng chưa lưu sẽ bị xóa. Báo giá đã lưu trong Lịch sử không bị ảnh hưởng.",
      confirmText: "Hủy bản nháp",
      onConfirm: () => {
        setCurrentQuote(createBlankQuote());
        setHasActiveQuoteDraft(false);
        showToast("Đã hủy bản nháp báo giá.");
      },
    });
  };

  const slugifyVietnamese = (str) => {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  };

  const handleDownloadPDF = async () => {
    const element = document.querySelector(".printable-area");
    if (!element) return;

    const dateStr = (
      quoteForPrint.quoteDate || new Date().toLocaleDateString("vi-VN")
    ).replace(/[\/\.]/g, "-");
    const custSlug = slugifyVietnamese(
      quoteForPrint.customerName || "Khach-Hang",
    );
    const quoteNoSlug = quoteForPrint.quoteNo ? `-${quoteForPrint.quoteNo}` : "";
    const pdfFilename =
      `Bao-gia-${printPaperSize.toUpperCase()}-${dateStr}-${custSlug}${quoteNoSlug}.pdf`.replace(/-+/g, "-");

    showToast(`Đang kết xuất và tải ${pdfFilename}...`);

    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = `${activePaperSize.previewWidth}px`;
    container.style.background = "#ffffff";
    container.style.padding = "0";
    container.style.margin = "0";

    const clone = element.cloneNode(true);
    clone.style.overflow = "visible";
    clone.style.maxHeight = "none";
    clone.style.height = "auto";
    clone.style.boxShadow = "none";
    clone.style.margin = "0";
    clone.style.width = `${activePaperSize.previewWidth}px`;
    clone.style.maxWidth = `${activePaperSize.previewWidth}px`;
    clone.style.padding = "0";

    container.appendChild(clone);
    document.body.appendChild(container);

    const opt = {
      margin: [5, 5, 5, 5],
      filename: pdfFilename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        scrollY: 0,
        scrollX: 0,
        windowWidth: 1024,
      },
      jsPDF: { unit: "mm", format: activePaperSize.jsPdfFormat, orientation: "portrait" },
    };

    try {
      await html2pdf().set(opt).from(clone).save();
      showToast(`✅ Đã tải ${pdfFilename}.`, window.__TAURI_INTERNALS__ ? {
        label: "Mở Downloads",
        onClick: async () => {
          try {
            await invoke("open_downloads_folder");
          } catch (e) {
            showToast("Không thể mở thư mục Downloads.");
          }
        },
      } : null);
    } catch (err) {
      console.error("PDF Export error:", err);
    } finally {
      document.body.removeChild(container);
    }
  };

  const handlePrintQuote = (paperSize = printPaperSize) => {
    const printStyle = document.createElement("style");
    printStyle.id = "dby-print-paper-size";
    printStyle.textContent = `@page { size: ${paperSize.toUpperCase()} portrait; margin: 5mm; }`;
    document.head.appendChild(printStyle);
    window.print();
    window.setTimeout(() => printStyle.remove(), 500);
  };

  const handleAddNewItemToQuote = () => {
    const nextStt = currentQuote.items.length + 1;
    const newItem = {
      id: `item-${Date.now()}`,
      stt: nextStt,
      pn: `P/N-${nextStt}`,
      desc: "Sản phẩm / Dịch vụ mới",
      quantity: 1,
      unit: "Chiếc",
      unitPrice: 100000,
      totalPrice: 100000,
    };
    setCurrentQuote((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleRemoveQuoteItem = (id) => {
    setCurrentQuote((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== id),
    }));
  };

  const handleItemChange = (id, field, value) => {
    setCurrentQuote((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          const q = Number(field === "quantity" ? value : item.quantity) || 0;
          const p = Number(field === "unitPrice" ? value : item.unitPrice) || 0;
          updated.totalPrice = q * p;
        }
        return updated;
      }),
    }));
  };

  const input = (label, hint, value, setValue, unit, icon) => (
    <label className="input-row">
      <span className="field-icon">{icon}</span>
      <span className="field-copy">
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
      <span className="number-wrap">
        <input
          inputMode={unit.includes("VND") ? "numeric" : "decimal"}
          value={unit.includes("VND") ? formatMoneyInput(value) : value}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9.]/g, "");
            if (unit.includes("VND")) {
              const digits = raw.replace(/[^0-9]/g, "");
              setValue(digits ? money.format(Number(digits)) : "");
              return;
            }
            setValue(raw);
          }}
        />
        <em>{unit}</em>
      </span>
    </label>
  );

  return (
    <div className="app-shell">
      {["checking", "downloading", "installing", "installed"].includes(
        updateStatus,
      ) && (
        <div className="update-progress-overlay" role="alertdialog" aria-live="assertive">
          <div className="update-progress-card">
            <div className={`update-progress-icon ${updateStatus}`}>
              {updateStatus === "installed" ? (
                <Check size={34} weight="bold" />
              ) : (
                <Download size={32} />
              )}
            </div>
            <span className="update-progress-kicker">CẬP NHẬT HỆ THỐNG</span>
            <h2>
              {updateStatus === "checking"
                ? "Đang kiểm tra phiên bản mới"
                : updateStatus === "downloading"
                  ? `Đang tải phiên bản ${updateTargetVersion}`
                  : updateStatus === "installing"
                    ? "Đang cài đặt bản cập nhật"
                    : "Cài đặt hoàn tất"}
            </h2>
            <p>{updateMessage}</p>
            <div
              className={`update-progress-track ${updateStatus === "checking" ? "indeterminate" : ""}`}
              aria-label="Tiến độ cập nhật"
            >
              <span
                style={{
                  width:
                    updateStatus === "checking"
                      ? "35%"
                      : `${Math.max(updateProgress, updateStatus === "installing" ? 100 : 4)}%`,
                }}
              />
            </div>
            <div className="update-progress-meta">
              <strong>
                {updateStatus === "checking"
                  ? "Đang kết nối..."
                  : updateStatus === "downloading"
                    ? updateProgress > 0
                      ? `${updateProgress}%`
                      : "Đang chuẩn bị tải..."
                    : "100%"}
              </strong>
              <span>Không tắt máy hoặc đóng ứng dụng</span>
            </div>
            <div className="update-restart-notice">
              Ứng dụng sẽ tự đóng trong lúc cài đặt và tự mở lại sau khi hoàn tất.
            </div>
          </div>
        </div>
      )}
      {toastMsg && (
        <div className="toast-notification">
          <Check size={18} /> <span>{toastMsg}</span>
          {toastAction && (
            <button
              type="button"
              onClick={async () => {
                await toastAction.onClick();
                setToastAction(null);
              }}
            >
              {toastAction.label}
            </button>
          )}
        </div>
      )}
      <header className="window-bar" onMouseDown={handleWindowDrag}>
        <img className="brand-mark" src={dbyLogo} alt="DBY" />
        <strong>DBY LABEL PRICING</strong>
        <div
          className="window-actions"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Thu nhỏ cửa sổ"
            onClick={() => appWindow.minimize()}
          >
            —
          </button>
          <button
            type="button"
            aria-label="Phóng to cửa sổ"
            onClick={() => appWindow.toggleMaximize()}
          >
            □
          </button>
          <button
            type="button"
            aria-label="Đóng cửa sổ"
            onClick={() => appWindow.close()}
          >
            <X size={18} />
          </button>
        </div>
      </header>
      <nav
        className="title-menu"
        aria-label="Menu chính"
        onMouseDown={handleWindowDrag}
      >
        <button
          className={`tool-item ${activeMenu === "tem" ? "active" : ""}`}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => {
            setActiveMenu("tem");
            setCategory("tem");
            setFormula("tem-known-meters");
          }}
        >
          <ToiletPaper size={17} />
          <span>Tem nhãn</span>
        </button>
        <button
          className={`tool-item ${activeMenu === "muc" ? "active" : ""}`}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => {
            setActiveMenu("muc");
            setCategory("muc");
            setFormula("muc-standard");
          }}
        >
          <Cylinder size={17} />
          <span>Mực in ribbon</span>
        </button>
        <button
          className={`tool-item ${activeMenu === "gia-cong" ? "active" : ""}`}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => {
            setActiveMenu("gia-cong");
            setCategory("gia-cong");
          }}
        >
          <Wrench size={17} />
          <span>Gia công</span>
        </button>
        <button
          className={`tool-item ${activeMenu === "gia-nhap" ? "active" : ""}`}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => {
            setActiveMenu("gia-nhap");
            setCategory("gia-nhap");
          }}
        >
          <UsersThree size={17} />
          <span>Khách hàng</span>
        </button>
        <button
          className={`tool-item ${activeMenu === "bao-gia" ? "active" : ""}`}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => {
            setActiveMenu("bao-gia");
            setCategory("bao-gia");
          }}
        >
          <FileText size={17} />
          <span>Báo giá</span>
        </button>
        <button
          className={`tool-item ${activeMenu === "cai-dat" ? "active" : ""}`}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => {
            setActiveMenu("cai-dat");
            setCategory("cai-dat");
          }}
        >
          <Gear size={17} />
          <span>Cài đặt</span>
        </button>
      </nav>
      <div className="app-body">
        <aside className="sidebar">
          <div className="side-top">
            <div className="logo-round">U</div>
            <span>
              UNITECH
              <br />
              <small>PRICING DESK</small>
            </span>
          </div>
          <nav>
            <button
              className={`nav-item ${activeMenu === "tem" ? "active" : ""}`}
              onClick={() => {
                setActiveMenu("tem");
                setCategory("tem");
                setFormula("tem-known-meters");
              }}
            >
              <ToiletPaper
                size={20}
                weight={activeMenu === "tem" ? "duotone" : "regular"}
              />{" "}
              Tem nhãn
            </button>
            <button
              className={`nav-item ${activeMenu === "muc" ? "active" : ""}`}
              onClick={() => {
                setActiveMenu("muc");
                setCategory("muc");
                setFormula("muc-standard");
              }}
            >
              <Cylinder
                size={20}
                weight={activeMenu === "muc" ? "duotone" : "regular"}
              />{" "}
              Mực in ribbon
            </button>
            <button
              className={`nav-item ${activeMenu === "gia-cong" ? "active" : ""}`}
              onClick={() => {
                setActiveMenu("gia-cong");
                setCategory("gia-cong");
              }}
            >
              <Wrench
                size={20}
                weight={activeMenu === "gia-cong" ? "duotone" : "regular"}
              />{" "}
              Gia công
            </button>
            <button
              className={`nav-item ${activeMenu === "gia-nhap" ? "active" : ""}`}
              onClick={() => {
                setActiveMenu("gia-nhap");
                setCategory("gia-nhap");
              }}
            >
              <UsersThree
                size={20}
                weight={activeMenu === "gia-nhap" ? "duotone" : "regular"}
              />{" "}
              Khách hàng
            </button>
            <button
              className={`nav-item ${activeMenu === "bao-gia" ? "active" : ""}`}
              onClick={() => {
                setActiveMenu("bao-gia");
                setCategory("bao-gia");
              }}
            >
              <FileText
                size={20}
                weight={activeMenu === "bao-gia" ? "duotone" : "regular"}
              />{" "}
              Báo giá
            </button>
            <button
              className={`nav-item ${activeMenu === "cai-dat" ? "active" : ""}`}
              onClick={() => {
                setActiveMenu("cai-dat");
                setCategory("cai-dat");
              }}
            >
              <Gear
                size={20}
                weight={activeMenu === "cai-dat" ? "duotone" : "regular"}
              />{" "}
              Cài đặt
            </button>
          </nav>
          <div className="side-foot">
            <div className="offline-dot" /> Offline Mode
            <div className="company">
              Công ty CP Công Nghệ
              <br />
              Unitech Việt Nam
            </div>
            <div className="dev-credit">
              Dev by <strong>dbysoftware.com</strong>
            </div>
          </div>
        </aside>
        <main className="content">
          <nav className="action-toolbar" aria-label="Menu chính">
            <button
              className={`tool-item ${activeMenu === "tem" ? "active" : ""}`}
              onClick={() => {
                setActiveMenu("tem");
                setCategory("tem");
                setFormula("tem-known-meters");
              }}
            >
              <ToiletPaper size={27} />
              <span>Tem nhãn</span>
            </button>
            <button
              className={`tool-item ${activeMenu === "muc" ? "active" : ""}`}
              onClick={() => {
                setActiveMenu("muc");
                setCategory("muc");
                setFormula("muc-standard");
              }}
            >
              <Cylinder size={27} />
              <span>Mực in ribbon</span>
            </button>
            <button
              className={`tool-item ${activeMenu === "gia-cong" ? "active" : ""}`}
              onClick={() => {
                setActiveMenu("gia-cong");
                setCategory("gia-cong");
              }}
            >
              <Wrench size={27} />
              <span>Gia công</span>
            </button>
            <button
              className={`tool-item ${activeMenu === "gia-nhap" ? "active" : ""}`}
              onClick={() => {
                setActiveMenu("gia-nhap");
                setCategory("gia-nhap");
              }}
            >
              <UsersThree size={27} />
              <span>Khách hàng</span>
            </button>
            <button
              className={`tool-item ${activeMenu === "bao-gia" ? "active" : ""}`}
              onClick={() => {
                setActiveMenu("bao-gia");
                setCategory("bao-gia");
              }}
            >
              <FileText size={27} />
              <span>Báo giá</span>
            </button>
            <button
              className={`tool-item ${activeMenu === "cai-dat" ? "active" : ""}`}
              onClick={() => {
                setActiveMenu("cai-dat");
                setCategory("cai-dat");
              }}
            >
              <Gear size={27} />
              <span>Cài đặt</span>
            </button>
          </nav>

          <div className="crumb">
            <House size={16} /> <span>/</span> Tra cứu & Quản lý <span>/</span>{" "}
            <strong>
              {category === "tem"
                ? "Tem trắng · biết số mét"
                : category === "gia-nhap"
                  ? "Khách hàng"
                  : category === "muc"
                    ? "Mực in ribbon"
                    : category === "gia-cong"
                      ? "Gia công"
                      : category === "bao-gia"
                        ? "Báo giá"
                        : "Cài đặt"}
            </strong>
          </div>

          {category !== "gia-nhap" && category !== "bao-gia" && (
            <div className="page-head">
              <div className="roll-icon">
                {category === "tem" ? (
                  <ToiletPaper size={33} weight="duotone" />
                ) : category === "muc" ? (
                  <Cylinder size={33} weight="duotone" />
                ) : category === "gia-cong" ? (
                  <Wrench size={33} weight="duotone" />
                ) : (
                  <Gear size={33} weight="duotone" />
                )}
              </div>
              <div>
                <h1>
                  {category === "tem"
                    ? "Tính giá tem nhãn"
                    : category === "muc"
                      ? "Tính giá mực in ribbon"
                      : category === "gia-cong"
                        ? "Gia công"
                        : "Cài đặt hệ thống"}
                </h1>
              </div>

              {category === "tem" && (
                <label className="formula-select">
                  <span>Phương thức báo giá</span>
                  <select
                    value={formula}
                    onChange={(event) => setFormula(event.target.value)}
                  >
                    <option value="tem-known-meters">
                      1. Báo giá cuộn tem theo chiều dài (mét)
                    </option>
                    <option value="tem-piece">
                      2. Báo giá tem theo đơn vị chiếc
                    </option>
                    <option value="tem-roll-quantity">
                      3. Báo giá cuộn tem theo số lượng tem
                    </option>
                    <option value="tem-label-count">
                      4. Quy đổi số lượng tem trên cuộn
                    </option>
                    <option value="tem-one-color">
                      5. Báo giá tem in 1 màu
                    </option>
                    <option value="tem-two-color">
                      6. Báo giá tem in nhiều màu
                    </option>
                    <option value="tem-laminated">
                      7. Báo giá tem màu cán màng
                    </option>
                  </select>
                </label>
              )}
            </div>
          )}

          {/* VIEW: KHACH HANG & GIA NHAP (Combined Module) */}
          {category === "gia-nhap" ? (
            <div className="master-data-module">
              {/* Module Sub-tabs Bar */}
              <div className="sub-tabs-bar">
                <div className="segmented-control">
                  <button
                    className={`segmented-tab ${khachHangSubTab === "customers" ? "active" : ""}`}
                    onClick={() => setKhachHangSubTab("customers")}
                  >
                    <UsersThree size={16} />
                    <span>Danh bạ Khách hàng</span>
                    <span className="badge-count">{customers.length}</span>
                  </button>
                  <button
                    className={`segmented-tab ${khachHangSubTab === "supplier-prices" ? "active" : ""}`}
                    onClick={() => setKhachHangSubTab("supplier-prices")}
                  >
                    <Tag size={16} />
                    <span>Bảng Giá nhập theo NCC</span>
                    <span className="badge-count">{supplierPrices.length}</span>
                  </button>
                </div>
                <div className="sub-tabs-right">
                  {khachHangSubTab === "customers" ? (
                    <button
                      className="header-btn primary-header-btn"
                      onClick={() => {
                        resetCustomerForm();
                        setShowCustomerForm(true);
                      }}
                    >
                      <UserPlus size={16} /> Thêm Khách hàng mới
                    </button>
                  ) : (
                    <button
                      className="header-btn primary-header-btn"
                      onClick={() => {
                        resetForm();
                        setShowAddForm(true);
                      }}
                    >
                      <Plus size={16} /> Thêm đơn giá giấy NCC
                    </button>
                  )}
                </div>
              </div>

              {khachHangSubTab === "customers" ? (
                <div className="supplier-pricing-view">
                  {/* Customers Stats */}
                  <div className="supplier-stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon icon-building">
                        <UsersThree size={24} />
                      </div>
                      <div>
                        <div className="stat-value">{customers.length}</div>
                        <div className="stat-label">
                          Khách hàng trong danh bạ
                        </div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon icon-stack">
                        <Building size={24} />
                      </div>
                      <div>
                        <div className="stat-value">
                          {
                            customers.filter((c) => c.type === "Doanh nghiệp")
                              .length
                          }
                        </div>
                        <div className="stat-label">Doanh nghiệp / Cty</div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon icon-tag">
                        <FileText size={24} />
                      </div>
                      <div>
                        <div className="stat-value">Sẵn sàng</div>
                        <div className="stat-label">Tự động điền báo giá</div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Modal Add/Edit */}
                  {showCustomerForm && (
                    <div
                      className="modal-overlay"
                      onClick={(e) => {
                        if (e.target === e.currentTarget) resetCustomerForm();
                      }}
                    >
                      <div className="modal-content">
                        <form onSubmit={handleSaveCustomer}>
                          <div className="form-card-header">
                            <h3>
                              {editingCustomerId
                                ? "Chỉnh sửa thông tin Khách hàng"
                                : "Thêm mới Khách hàng vào Danh bạ"}
                            </h3>
                            <button
                              type="button"
                              className="close-form-btn"
                              onClick={resetCustomerForm}
                            >
                              <X size={20} />
                            </button>
                          </div>
                          <div className="form-grid">
                            <div className="form-group span-2">
                              <label>Tên Công Ty / Tên Khách Hàng (*)</label>
                              <input
                                placeholder="VD: CÔNG TY TNHH CANON VIỆT NAM"
                                value={formCustName}
                                onChange={(e) =>
                                  setFormCustName(e.target.value)
                                }
                                autoFocus
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Tên viết tắt / Tên ngắn</label>
                              <input
                                placeholder="VD: Canon Việt Nam"
                                value={formCustShortName}
                                onChange={(e) =>
                                  setFormCustShortName(e.target.value)
                                }
                              />
                            </div>
                            <div className="form-group span-2">
                              <label>Địa chỉ công ty / Giao hàng</label>
                              <input
                                placeholder="VD: KCN Thăng Long, Huyện Đông Anh, Hà Nội"
                                value={formCustAddress}
                                onChange={(e) =>
                                  setFormCustAddress(e.target.value)
                                }
                              />
                            </div>
                            <div className="form-group">
                              <label>Mã số thuế</label>
                              <input
                                placeholder="VD: 0101156677"
                                value={formCustTax}
                                onChange={(e) => setFormCustTax(e.target.value)}
                              />
                            </div>
                            <div className="form-group">
                              <label>Số điện thoại liên hệ</label>
                              <input
                                placeholder="VD: 024.3881.1222"
                                value={formCustPhone}
                                onChange={(e) =>
                                  setFormCustPhone(e.target.value)
                                }
                              />
                            </div>
                            <div className="form-group">
                              <label>Email liên hệ</label>
                              <input
                                placeholder="VD: contact@canon.com.vn"
                                value={formCustEmail}
                                onChange={(e) =>
                                  setFormCustEmail(e.target.value)
                                }
                              />
                            </div>
                            <div className="form-group">
                              <label>Người liên hệ phụ trách</label>
                              <input
                                placeholder="VD: Chị Thảo - Kế toán kho"
                                value={formCustContact}
                                onChange={(e) =>
                                  setFormCustContact(e.target.value)
                                }
                              />
                            </div>
                          </div>
                          <div className="form-actions">
                            <button
                              type="button"
                              className="btn-cancel"
                              onClick={resetCustomerForm}
                            >
                              Hủy
                            </button>
                            <button type="submit" className="btn-save">
                              <Check size={18} />{" "}
                              {editingCustomerId
                                ? "Cập nhật Khách hàng"
                                : "Lưu vào Danh bạ"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Customer Filter Bar */}
                  <div className="table-filter-bar">
                    <div className="search-input-wrap">
                      <MagnifyingGlass size={18} />
                      <input
                        placeholder="Tìm kiếm Khách hàng theo tên Cty, địa chỉ, sđt, email, MST..."
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      />
                      {customerSearchQuery && (
                        <button
                          className="clear-search"
                          onClick={() => setCustomerSearchQuery("")}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Customers Table */}
                  <div className="supplier-table-container">
                    <table className="supplier-table">
                      <thead>
                        <tr>
                          <th>Mã KH</th>
                          <th>Tên Công Ty & Người Liên Hệ</th>
                          <th>Địa Chỉ Giao Hàng</th>
                          <th>SĐT & Email</th>
                          <th className="text-center">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map((cust) => (
                            <tr key={cust.id}>
                              <td>
                                <span className="code-pill">{cust.code}</span>
                              </td>
                              <td>
                                <div className="material-info">
                                  <strong>{cust.name}</strong>
                                  {cust.contactPerson && (
                                    <small>Liên hệ: {cust.contactPerson}</small>
                                  )}
                                </div>
                              </td>
                              <td style={{ maxWidth: "260px" }}>
                                <small>{cust.address || "Chưa cập nhật"}</small>
                              </td>
                              <td>
                                <div className="material-info">
                                  <strong>{cust.phone || "—"}</strong>
                                  <small>{cust.email || "—"}</small>
                                </div>
                              </td>
                              <td>
                                <div className="table-actions">
                                  <button
                                    type="button"
                                    className="action-btn btn-apply"
                                    title="Tạo báo giá cho Khách hàng này"
                                    onClick={() =>
                                      handleSelectCustomerForQuote(cust)
                                    }
                                  >
                                    <FileText size={15} /> Báo giá
                                  </button>
                                  <button
                                    type="button"
                                    className="action-btn btn-edit"
                                    title="Sửa thông tin khách hàng"
                                    onClick={() => handleEditCustomer(cust)}
                                  >
                                    <Pencil size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    className="action-btn btn-delete"
                                    title="Xóa khách hàng khỏi danh bạ"
                                    onClick={() =>
                                      handleDeleteCustomer(cust.id, cust.name)
                                    }
                                  >
                                    <Trash size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="empty-table-cell">
                              <Info size={28} />
                              <p>
                                Không tìm thấy khách hàng nào trong danh bạ.
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Subtab 2: Supplier Paper Prices */
                <div className="supplier-pricing-view">
                  <div className="supplier-stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon icon-building">
                        <Building size={24} />
                      </div>
                      <div>
                        <div className="stat-value">{stats.countSuppliers}</div>
                        <div className="stat-label">Nhà cung cấp</div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon icon-stack">
                        <Stack size={24} />
                      </div>
                      <div>
                        <div className="stat-value">{stats.countItems}</div>
                        <div className="stat-label">Mã giấy Decal</div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon icon-tag">
                        <Tag size={24} />
                      </div>
                      <div>
                        <div className="stat-value">
                          {money.format(stats.avgPrice)} <small>VND/m²</small>
                        </div>
                        <div className="stat-label">Giá nhập trung bình</div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon icon-calc">
                        <Calculator size={24} />
                      </div>
                      <div>
                        <div className="stat-value">
                          {money.format(stats.minPrice)} -{" "}
                          {money.format(stats.maxPrice)} <small>VND/m²</small>
                        </div>
                        <div className="stat-label">Khoảng đơn giá nhập</div>
                      </div>
                    </div>
                  </div>

                  {showAddForm && (
                    <div
                      className="modal-overlay"
                      onClick={(e) => {
                        if (e.target === e.currentTarget) resetForm();
                      }}
                    >
                      <div className="modal-content">
                        <form onSubmit={handleSaveSupplierPrice}>
                          <div className="form-card-header">
                            <h3>
                              {editingId
                                ? "Chỉnh sửa đơn giá giấy NCC"
                                : "Thêm mới đơn giá giấy NCC"}
                            </h3>
                            <button
                              type="button"
                              className="close-form-btn"
                              onClick={resetForm}
                            >
                              <X size={20} />
                            </button>
                          </div>
                          <div className="form-grid">
                            <div className="form-group">
                              <label>Nhà cung cấp (*)</label>
                              <input
                                placeholder="VD: Avery Dennison (Fasson), Lintec, UPM..."
                                value={formSupplier}
                                onChange={(e) =>
                                  setFormSupplier(e.target.value)
                                }
                                autoFocus
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Mã loại giấy / Code (*)</label>
                              <input
                                placeholder="VD: BW0153, AW0331, K2441..."
                                value={formCode}
                                onChange={(e) => setFormCode(e.target.value)}
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Tên chất liệu / Đặc tính giấy</label>
                              <input
                                placeholder="VD: Decal màng Gloss White / Keo Ak13 dính cao"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                              />
                            </div>
                            <div className="form-group">
                              <label>Đơn giá giấy (VND/m²) (*)</label>
                              <div className="input-with-unit">
                                <input
                                  inputMode="numeric"
                                  placeholder="VD: 8.500"
                                  value={formatMoneyInput(formPaperPrice)}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/[^0-9]/g, "");
                                    setFormPaperPrice(raw ? money.format(Number(raw)) : "");
                                  }}
                                  required
                                />
                                <span>VND/m²</span>
                              </div>
                            </div>
                            <div className="form-group span-2">
                              <label>
                                Ghi chú (Khổ cuộn, ứng dụng, bao gồm VAT...)
                              </label>
                              <input
                                placeholder="VD: Khổ 1000mm x 2000m, keo bám gỗ & chai lọ"
                                value={formNote}
                                onChange={(e) => setFormNote(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="form-actions">
                            <button
                              type="button"
                              className="btn-cancel"
                              onClick={resetForm}
                            >
                              Hủy
                            </button>
                            <button type="submit" className="btn-save">
                              <Check size={18} />{" "}
                              {editingId
                                ? "Cập nhật đơn giá"
                                : "Lưu vào bảng giá"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  <div className="table-filter-bar">
                    <div className="search-input-wrap">
                      <MagnifyingGlass size={18} />
                      <input
                        placeholder="Tìm kiếm theo Nhà cung cấp, mã giấy, tên chất liệu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button
                          className="clear-search"
                          onClick={() => setSearchQuery("")}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <div className="filter-select-wrap">
                      <Funnel size={17} />
                      <select
                        value={filterSupplier}
                        onChange={(e) => setFilterSupplier(e.target.value)}
                      >
                        <option value="ALL">Tất cả Nhà Cung Cấp</option>
                        {suppliersList.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    {(searchQuery || filterSupplier !== "ALL") && (
                      <button
                        className="btn-reset-filters"
                        onClick={() => {
                          setSearchQuery("");
                          setFilterSupplier("ALL");
                        }}
                      >
                        <ArrowsCounterClockwise size={15} /> Xóa bộ lọc
                      </button>
                    )}
                  </div>

                  <div className="supplier-table-container">
                    <table className="supplier-table">
                      <thead>
                        <tr>
                          <th>Nhà Cung Cấp</th>
                          <th>Mã Loại Giấy</th>
                          <th>Tên Chất Liệu & Ghi Chú</th>
                          <th className="text-right">Giá Giấy (VND/m²)</th>
                          <th>Cập Nhật</th>
                          <th className="text-center">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPrices.length > 0 ? (
                          filteredPrices.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <div className="supplier-badge">
                                  <Building size={15} />
                                  <strong>{item.supplier}</strong>
                                </div>
                              </td>
                              <td>
                                <span className="code-pill">{item.code}</span>
                              </td>
                              <td>
                                <div className="material-info">
                                  <strong>{item.name}</strong>
                                  {item.note && <small>{item.note}</small>}
                                </div>
                              </td>
                              <td className="text-right">
                                <b className="price-tag">
                                  {money.format(item.paperPrice)} đ/m²
                                </b>
                              </td>
                              <td className="updated-date">{item.updatedAt}</td>
                              <td>
                                <div className="table-actions">
                                  <button
                                    type="button"
                                    className="action-btn btn-apply"
                                    title="Áp dụng đơn giá này vào Bảng tính Tem nhãn"
                                    onClick={() =>
                                      handleApplyToCalculator(item)
                                    }
                                  >
                                    <ArrowRight size={15} /> Áp giá
                                  </button>
                                  <button
                                    type="button"
                                    className="action-btn btn-edit"
                                    title="Chỉnh sửa thông tin"
                                    onClick={() => handleEditSupplier(item)}
                                  >
                                    <Pencil size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    className="action-btn btn-delete"
                                    title="Xóa khỏi bảng giá"
                                    onClick={() =>
                                      handleDeleteSupplier(item.id, item.code)
                                    }
                                  >
                                    <Trash size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="empty-table-cell">
                              <Info size={28} />
                              <p>
                                Không tìm thấy mã giấy nào phù hợp với từ khóa
                                tìm kiếm.
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : category === "bao-gia" ? (
            /* VIEW: BAO GIA (Quotation System) */
            <div className="quotation-system-view">
              <div className="sub-tabs-bar">
                <div className="segmented-control">
                  <button
                    className={`segmented-tab ${baoGiaSubTab === "editor" ? "active" : ""}`}
                    onClick={() => setBaoGiaSubTab("editor")}
                  >
                    <Pencil size={16} />
                    <span>Soạn thảo Báo giá</span>
                    <span className="badge-count">
                      {currentQuote.items.length}
                    </span>
                  </button>
                  <button
                    className={`segmented-tab ${baoGiaSubTab === "history" ? "active" : ""}`}
                    onClick={() => setBaoGiaSubTab("history")}
                  >
                    <FileText size={16} />
                    <span>Lịch sử Báo giá đã lưu</span>
                    <span className="badge-count">{savedQuotes.length}</span>
                  </button>
                </div>
                {hasActiveQuoteDraft && <div className="sub-tabs-right">
                  <button
                    className="header-btn primary-header-btn"
                    onClick={() => setShowPrintModal(true)}
                  >
                    <Printer size={16} /> Xem bản xem trước / In PDF
                  </button>
                </div>}
              </div>

              {baoGiaSubTab === "editor" ? (
                !hasActiveQuoteDraft ? (
                  <section className="quote-waiting-screen">
                    <div className="quote-waiting-icon">
                      <FileText size={38} />
                    </div>
                    <h2>Chưa mở báo giá nào</h2>
                    <p>
                      Tạo báo giá mới để bắt đầu nhập thông tin khách hàng và
                      thêm sản phẩm, hoặc mở lại một báo giá trong Lịch sử.
                    </p>
                    <button
                      type="button"
                      className="primary-cta quote-waiting-create"
                      onClick={() => {
                        setCurrentQuote(createBlankQuote());
                        setHasActiveQuoteDraft(true);
                        showToast("Đã mở báo giá mới để soạn thảo.");
                      }}
                    >
                      <Plus size={20} /> Tạo báo giá mới
                    </button>
                  </section>
                ) : (
                <div className="quote-editor-grid">
                  {/* Customer & Quote Header Inputs (Unified 2-Column Row) */}
                  <div className="quote-header-card-row">
                    {/* Left Box: Customer Info */}
                    <div className="quote-card compact-card customer-card-box">
                      <div className="quote-card-header">
                        <div className="card-title-group">
                          <UsersThree size={18} />
                          <h3>1. Khách hàng (Bên mua)</h3>
                        </div>
                        <div className="quick-select-inline">
                          <select
                            onChange={(e) => {
                              const found = customers.find(
                                (c) => c.id === e.target.value,
                              );
                              if (found) {
                                setCurrentQuote((prev) => ({
                                  ...prev,
                                  customerName: found.name,
                                  customerAddress: found.address,
                                  customerEmail: found.email,
                                  customerPhone: found.phone,
                                }));
                                showToast(
                                  `Đã điền tự động thông tin khách hàng ${found.shortName || found.name}`,
                                );
                              }
                            }}
                          >
                            <option value="">
                              ⚡ Chọn nhanh từ Danh bạ KH...
                            </option>
                            {customers.map((c) => (
                              <option key={c.id} value={c.id}>
                                [{c.code}] {c.shortName || c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="compact-form-grid">
                        <div className="form-group span-2">
                          <label>Tên Công ty / Khách hàng (*)</label>
                          <input
                            value={currentQuote.customerName}
                            onChange={(e) =>
                              setCurrentQuote((prev) => ({
                                ...prev,
                                customerName: e.target.value,
                              }))
                            }
                            placeholder="VD: CÔNG TY TNHH MTV SEDO VINAKO"
                          />
                        </div>
                        <div className="form-group span-2">
                          <label>Địa chỉ giao hàng</label>
                          <input
                            value={currentQuote.customerAddress}
                            onChange={(e) =>
                              setCurrentQuote((prev) => ({
                                ...prev,
                                customerAddress: e.target.value,
                              }))
                            }
                            placeholder="VD: Thôn Đông Yên, Xã Duy Xuyên, TP Đà Nẵng"
                          />
                        </div>
                        <div className="form-group">
                          <label>Số điện thoại</label>
                          <input
                            value={currentQuote.customerPhone}
                            onChange={(e) =>
                              setCurrentQuote((prev) => ({
                                ...prev,
                                customerPhone: e.target.value,
                              }))
                            }
                            placeholder="VD: 0236.3888.999"
                          />
                        </div>
                        <div className="form-group">
                          <label>Email khách hàng</label>
                          <input
                            value={currentQuote.customerEmail}
                            onChange={(e) =>
                              setCurrentQuote((prev) => ({
                                ...prev,
                                customerEmail: e.target.value,
                              }))
                            }
                            placeholder="VD: contact@sedovinako.com"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Box: Sales Info */}
                    <div className="quote-card compact-card sales-card-box">
                      <div className="quote-card-header">
                        <div className="card-title-group">
                          <Building size={18} />
                          <h3>2. Đơn Báo giá & Sales</h3>
                        </div>
                      </div>
                      <div className="compact-form-grid">
                        <div className="form-group">
                          <label>Số Báo giá</label>
                          <input
                            value={currentQuote.quoteNo}
                            onChange={(e) =>
                              setCurrentQuote((prev) => ({
                                ...prev,
                                quoteNo: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>Ngày báo giá</label>
                          <input
                            value={currentQuote.quoteDate}
                            onChange={(e) =>
                              setCurrentQuote((prev) => ({
                                ...prev,
                                quoteDate: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>Người báo giá (Sales)</label>
                          <input
                            value={currentQuote.salesName}
                            onChange={(e) =>
                              setCurrentQuote((prev) => ({
                                ...prev,
                                salesName: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>SĐT Sales</label>
                          <input
                            value={currentQuote.salesPhone}
                            onChange={(e) =>
                              setCurrentQuote((prev) => ({
                                ...prev,
                                salesPhone: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Line Items Section */}
                  <div className="quote-card items-quote-card">
                    <div className="quote-card-header">
                      <div className="card-title-group">
                        <Package size={20} />
                        <h3>3. Bảng Chi tiết Hàng hóa Báo giá</h3>
                      </div>
                      <button
                        type="button"
                        className="header-btn"
                        onClick={handleAddNewItemToQuote}
                      >
                        <Plus size={15} /> Thêm dòng sản phẩm
                      </button>
                    </div>

                    <div className="supplier-table-container">
                      <table className="supplier-table quote-items-table">
                        <thead>
                          <tr>
                            <th style={{ width: "40px" }}>STT</th>
                            <th style={{ width: "120px" }}>P/N (Mã)</th>
                            <th>Miêu Tả & Thông Số Kỹ Thuật</th>
                            <th style={{ width: "80px" }}>Số Lượng</th>
                            <th style={{ width: "80px" }}>Đơn Vị</th>
                            <th
                              style={{ width: "130px" }}
                              className="text-right"
                            >
                              Đơn Giá (VND)
                            </th>
                            <th
                              style={{ width: "140px" }}
                              className="text-right"
                            >
                              Thành Tiền (VND)
                            </th>
                            <th
                              style={{ width: "50px" }}
                              className="text-center"
                            >
                              Xóa
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentQuote.items.length > 0 ? (
                            currentQuote.items.map((item, idx) => (
                              <tr key={item.id}>
                                <td className="text-center">{idx + 1}</td>
                                <td>
                                  <input
                                    className="table-inline-input"
                                    value={item.pn}
                                    onChange={(e) =>
                                      handleItemChange(
                                        item.id,
                                        "pn",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    className="table-inline-input"
                                    value={item.desc}
                                    onChange={(e) =>
                                      handleItemChange(
                                        item.id,
                                        "desc",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="table-inline-input text-center"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleItemChange(
                                        item.id,
                                        "quantity",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    className="table-inline-input text-center"
                                    value={item.unit}
                                    onChange={(e) =>
                                      handleItemChange(
                                        item.id,
                                        "unit",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </td>
                                <td className="text-right">
                                  <input
                                    inputMode="numeric"
                                    className="table-inline-input text-right"
                                    value={formatMoneyInput(item.unitPrice)}
                                    onChange={(e) => {
                                      const raw = e.target.value.replace(/[^0-9]/g, "");
                                      handleItemChange(item.id, "unitPrice", raw ? Number(raw) : 0);
                                    }}
                                  />
                                </td>
                                <td className="text-right font-bold text-green">
                                  {money.format(item.totalPrice)} đ
                                </td>
                                <td className="text-center">
                                  <button
                                    type="button"
                                    className="action-btn btn-delete"
                                    onClick={() =>
                                      handleRemoveQuoteItem(item.id)
                                    }
                                  >
                                    <Trash size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="8" className="empty-table-cell">
                                chưa có mặt hàng nào. Bấm nút "Thêm dòng sản
                                phẩm" hoặc chuyển sang tab Tem nhãn bấm "Tạo báo
                                giá".
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals & Tax Footer Bar */}
                    <div className="quote-totals-bar">
                      <div className="vat-selector">
                        <label>Mức thuế VAT:</label>
                        <select
                          value={currentQuote.vatRate}
                          onChange={(e) =>
                            setCurrentQuote((prev) => ({
                              ...prev,
                              vatRate: Number(e.target.value),
                            }))
                          }
                        >
                          <option value="8">8% (Theo NĐ giảm thuế)</option>
                          <option value="10">10% (Thuế tiêu chuẩn)</option>
                          <option value="0">0% (Không chịu thuế)</option>
                        </select>
                      </div>

                      <div className="totals-summary-box">
                        <div className="total-line">
                          <span>Tiền hàng (chưa VAT):</span>
                          <b>{money.format(quoteSubtotal)} đ</b>
                        </div>
                        <div className="total-line">
                          <span>Tiền thuế VAT ({currentQuote.vatRate}%):</span>
                          <b>{money.format(quoteVatAmount)} đ</b>
                        </div>
                        <div className="total-line grand-total">
                          <span>TỔNG CỘNG THANH TOÁN:</span>
                          <b>{money.format(quoteGrandTotal)} đ</b>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="quote-bottom-actions">
                    <button
                      type="button"
                      className="secondary-cta"
                      onClick={() => {
                        const makeNewQuote = () => {
                          const nextQuote = createBlankQuote();
                          setCurrentQuote(nextQuote);
                          setHasActiveQuoteDraft(true);
                          showToast(`Đã tạo mới báo giá ${nextQuote.quoteNo}`);
                        };

                        if (currentQuote.items.length > 0 || currentQuote.customerName) {
                          askConfirm({
                            title: "Tạo báo giá mới",
                            message: "Bản nháp hiện tại chưa được lưu. Bạn có muốn bỏ bản nháp này và tạo báo giá mới không?",
                            confirmText: "Tạo báo giá mới",
                            confirmVariant: "primary",
                            onConfirm: makeNewQuote,
                          });
                          return;
                        }

                        makeNewQuote();
                      }}
                    >
                      <Plus size={18} /> Tạo mới Báo giá
                    </button>
                    <button
                      type="button"
                      className="secondary-cta btn-cancel-draft"
                      onClick={handleCancelDraft}
                    >
                      <X size={18} /> Hủy bản nháp
                    </button>
                    <button
                      type="button"
                      className="primary-cta btn-save-quote"
                      onClick={handleSaveQuoteToHistory}
                    >
                      <FloppyDisk size={20} /> Lưu vào Lịch sử
                    </button>
                  </div>
                </div>
                )
              ) : (
                /* History Sub-tab */
                <div className="supplier-pricing-view">
                  <div className="supplier-table-container">
                    <table className="supplier-table">
                      <thead>
                        <tr>
                          <th>Mã Báo Giá</th>
                          <th>Khách Hàng (Bên mua)</th>
                          <th>Ngày Báo Giá</th>
                          <th>Số Dòng Hàng</th>
                          <th className="text-right">Tổng Tiền (Gồm VAT)</th>
                          <th className="text-center">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {savedQuotes.length > 0 ? (
                          savedQuotes.map((q) => (
                            <tr key={q.id}>
                              <td>
                                <span className="code-pill">{q.quoteNo}</span>
                              </td>
                              <td>
                                <div className="material-info">
                                  <strong>{q.customerName || "—"}</strong>
                                  <small>{q.customerAddress}</small>
                                </div>
                              </td>
                              <td>{q.quoteDate}</td>
                              <td>{q.items.length} mặt hàng</td>
                              <td className="text-right font-bold text-green">
                                {money.format(q.grandTotal)} đ
                              </td>
                              <td>
                                <div className="table-actions">
                                  <button
                                    type="button"
                                    className="action-btn btn-apply"
                                    onClick={() => {
                                      setCurrentQuote(q);
                                      setHasActiveQuoteDraft(true);
                                      setShowPrintModal(true);
                                    }}
                                  >
                                    <Printer size={15} /> In PDF
                                  </button>
                                  <button
                                    type="button"
                                    className="action-btn btn-edit"
                                    onClick={() => {
                                      setCurrentQuote(q);
                                      setHasActiveQuoteDraft(true);
                                      setBaoGiaSubTab("editor");
                                    }}
                                  >
                                    <Pencil size={15} /> Sửa
                                  </button>
                                  <button
                                    type="button"
                                    className="action-btn btn-delete"
                                    onClick={() => {
                                      askConfirm({
                                        title: "Xóa Báo Giá khỏi Lịch Sử",
                                        message: `Bạn có chắc chắn muốn xóa báo giá ${q.quoteNo} (${q.customerName || "Báo giá draft"}) không?`,
                                        confirmText: "Xóa Báo Giá",
                                        onConfirm: () => {
                                          setSavedQuotes((prev) =>
                                            prev.filter(
                                              (item) => item.id !== q.id,
                                            ),
                                          );
                                          showToast(`Đã xóa báo giá ${q.quoteNo}`);
                                        },
                                      });
                                    }}
                                  >
                                    <Trash size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="empty-table-cell">
                              <Info size={28} />
                              <p>
                                Chưa có bản báo giá nào được lưu vào lịch sử.
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : category === "cai-dat" ? (
            <section className="settings-update-panel">
              <div className="settings-update-icon"><Download size={30} /></div>
              <div>
                <h2>Cập nhật phần mềm</h2>
                <p>Kiểm tra và cài đặt phiên bản DBY Label Pricing mới nhất từ GitHub.</p>
                <small>Phiên bản hiện tại: v{appVersion}</small>
              </div>
              <button
                type="button"
                className="primary-cta settings-update-button"
                disabled={["checking", "downloading", "installing", "installed"].includes(updateStatus)}
                onClick={handleCheckForUpdates}
              >
                <Download size={18} />
                {["checking", "downloading", "installing", "installed"].includes(updateStatus)
                  ? "Đang kiểm tra / cài đặt..."
                  : "Kiểm tra cập nhật"}
              </button>
              {updateMessage && <p className={`update-message ${updateStatus}`}>{updateMessage}</p>}
            </section>
          ) : category === "tem" &&
            [
              "tem-known-meters",
              "tem-one-color",
              "tem-two-color",
              "tem-laminated",
            ].includes(formula) ? (
            <div className="workspace">
              <section className="panel inputs-panel">
                <div className="panel-title">
                  <span>1</span>
                  <div>
                    <h2>Thông tin đầu vào</h2>
                    <p>Các thông số dùng để tính giá một cuộn tem</p>
                  </div>
                </div>

                <div className="supplier-quick-select-box">
                  <div className="quick-select-header">
                    <Storefront size={16} />
                    <span>Chọn Giá giấy từ Nhà Cung Cấp:</span>
                  </div>
                  <select
                    value={selectedPaperCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setSelectedPaperCode(code);
                      if (code) {
                        const found = supplierPrices.find(
                          (item) => item.code === code,
                        );
                        if (found) {
                          setPaperPrice(formatMoneyInput(found.paperPrice));
                          showToast(
                            `Đã áp dụng giá giấy ${money.format(found.paperPrice)} VND/m² (${found.supplier} - ${found.code})`,
                          );
                        }
                      }
                    }}
                  >
                    <option value="">
                      -- Chọn loại giấy từ Bảng giá NCC --
                    </option>
                    {supplierPrices.map((item) => (
                      <option key={item.id} value={item.code}>
                        [{item.supplier}] {item.code} - {item.name} (
                        {money.format(item.paperPrice)} đ/m²)
                      </option>
                    ))}
                  </select>
                </div>
                {input(
                  "Chiều ngang tem",
                  "Kích thước ngang của 1 con tem",
                  width,
                  setWidth,
                  "mm",
                  <Ruler size={22} />,
                )}
                {input(
                  "Chiều dọc tem",
                  "Kích thước dọc của 1 con tem",
                  length,
                  setLength,
                  "mm",
                  <Tag size={22} />,
                )}
                {input(
                  "Chiều dài cuộn tem",
                  "Chiều dài cuộn tem khách yêu cầu",
                  meters,
                  setMeters,
                  "m",
                  <ToiletPaper size={22} />,
                )}
                {input(
                  "Giá giấy",
                  "Đơn giá vật liệu theo m²",
                  paperPrice,
                  setPaperPrice,
                  "VND/m²",
                  <Stack size={22} />,
                )}
                {input(
                  "Phí gia công",
                  "Sales tùy chỉnh theo số lượng đặt",
                  processing,
                  setProcessing,
                  "VND/cuộn",
                  <Wrench size={22} />,
                )}
                <div className="quantity-block">
                  <div className="qty-label">
                    <CirclesFour size={22} />
                    <span>
                      <strong>Số lượng tính giá</strong>
                      <small>Khách có thể đặt theo cuộn hoặc theo tem</small>
                    </span>
                  </div>
                  <div className="segmented">
                    <button
                      className={mode === "roll" ? "selected" : ""}
                      onClick={() => setMode("roll")}
                    >
                      Theo cuộn
                    </button>
                    <button
                      className={mode === "label" ? "selected" : ""}
                      onClick={() => setMode("label")}
                    >
                      Theo tem
                    </button>
                  </div>
                  {input(
                    mode === "roll" ? "Số lượng cuộn" : "Số lượng tem",
                    mode === "roll"
                      ? "Số cuộn cần báo giá"
                      : "Tạm tính 1.000 tem / cuộn",
                    quantity,
                    setQuantity,
                    mode === "roll" ? "cuộn" : "tem",
                    <CirclesFour size={22} />,
                  )}
                </div>
                <div className="notice">
                  <Info size={19} />
                  <div>
                    <strong>Quy tắc đang áp dụng</strong>
                    <span>
                      Biên cố định +5 mm · Chưa bao gồm VAT · Làm tròn lên
                      1.000đ
                    </span>
                  </div>
                </div>
                <div className="profit-inputs">
                  <div className="profit-mode-switch">
                    <strong>Biên lợi nhuận</strong>
                    <div className="segmented profit-segmented">
                      <button
                        className={profitMode === "percent" ? "selected" : ""}
                        onClick={() => setProfitMode("percent")}
                      >
                        Theo %
                      </button>
                      <button
                        className={profitMode === "amount" ? "selected" : ""}
                        onClick={() => setProfitMode("amount")}
                      >
                        Theo số tiền
                      </button>
                    </div>
                  </div>
                  {profitMode === "percent"
                    ? input(
                        "Biên lợi nhuận",
                        "Tính trên giá vốn sản xuất",
                        profitPercent,
                        setProfitPercent,
                        "%",
                        <Calculator size={22} />,
                      )
                    : input(
                        "Lợi nhuận cộng thêm",
                        "Số tiền cộng thêm trên mỗi cuộn",
                        profitAmount,
                        setProfitAmount,
                        "VND/cuộn",
                        <Plus size={22} />,
                      )}
                </div>
              </section>

              <section className="panel result-panel">
                <div className="panel-title">
                  <span className="result-number">2</span>
                  <div>
                    <h2>Kết quả tính toán</h2>
                    <p>Cập nhật ngay khi thay đổi thông số</p>
                  </div>
                </div>
                <div className="formula-box">
                  <div className="table-head">
                    <span>Hạng mục</span>
                    <span>Giá trị</span>
                  </div>
                  <div className="calc-row">
                    <span>Khổ tính tiền</span>
                    <b>
                      {width || 0} + 5 = {width ? Number(width) + 5 : 0} mm
                    </b>
                  </div>
                  <div className="calc-row">
                    <span>Diện tích vật liệu / cuộn</span>
                    <b>
                      {(displayCalc.usefulWidthM ?? displayCalc.usefulWidth)
                        .toFixed(3)
                        .replace(".", ",")}{" "}
                      m × {meters || 0} m ={" "}
                      {(displayCalc.materialAreaM2 ?? displayCalc.area)
                        .toFixed(2)
                        .replace(".", ",")}{" "}
                      m²
                    </b>
                  </div>
                  <div className="calc-row">
                    <span>Giá giấy</span>
                    <b>{money.format(parseMoneyInput(paperPrice))} VND/m²</b>
                  </div>
                  <div className="calc-row strong">
                    <span>Thành tiền giấy / cuộn</span>
                    <b>
                      {money.format(displayCalc.paperCost ?? displayCalc.paper)}{" "}
                      VND
                    </b>
                  </div>
                  <div className="calc-row">
                    <span>Phí gia công / cuộn</span>
                    <b>{money.format(parseMoneyInput(processing))} VND</b>
                  </div>
                  {["tem-one-color", "tem-two-color", "tem-laminated"].includes(
                    formula,
                  ) ? (
                    <div className="calc-row">
                      <span>Phụ phí màu / cán màng</span>
                      <b>
                        {formula === "tem-one-color"
                          ? "5.000"
                          : formula === "tem-two-color"
                            ? "7.000"
                            : "11.000"}{" "}
                        VND
                      </b>
                    </div>
                  ) : null}
                  <div className="calc-row total">
                    <span>Giá vốn sản xuất / cuộn</span>
                    <b>{fmt(salesPricing.productionCost)}</b>
                  </div>
                  <div className="calc-row">
                    <span>
                      {profitMode === "percent"
                        ? `Lợi nhuận theo ${salesPricing.percent}%`
                        : "Lợi nhuận cộng thêm"}
                    </span>
                    <b>{money.format(salesPricing.totalProfit)} VND</b>
                  </div>
                  <div className="calc-row total sale-price-row">
                    <span>Giá bán / cuộn (chưa VAT)</span>
                    <b>{fmt(salesPricing.salePrice)}</b>
                  </div>
                  <div className="calc-row order">
                    <span>Tổng giá bán đơn hàng</span>
                    <b>
                      {fmt(salesPricing.salePrice * (Number(quantity) || 0))}
                    </b>
                  </div>
                </div>
                <div className="price-card">
                  <div className="price-label">
                    GIÁ BÁN / CUỘN <small>(CHƯA VAT)</small>
                  </div>
                  <div className="price">
                    {fmt(salesPricing.salePrice)} <span>/ cuộn</span>
                  </div>
                  <div className="price-meta">
                    <span>
                      <Info size={17} /> Chưa bao gồm VAT
                    </span>
                    <span>
                      <Calculator size={17} /> Làm tròn lên 1.000đ
                    </span>
                  </div>
                </div>
                <div className="calc-actions">
                  <button
                    className="secondary-cta"
                    onClick={handlePreviewCalculationPdf}
                  >
                    <Printer size={18} /> Xem bản xem trước PDF
                  </button>
                  <button className="primary-cta" onClick={handleAddCalcToQuote}>
                    <FileText size={23} /> Tạo báo giá
                  </button>
                </div>
              </section>
            </div>
          ) : category === "tem" && formula === "tem-piece" ? (
            <div className="workspace">
              <section className="panel inputs-panel">
                <div className="panel-title">
                  <span>1</span>
                  <div>
                    <h2>Thông tin đầu vào</h2>
                    <p>Nhập kích thước của một tem nhãn</p>
                  </div>
                </div>
                {input(
                  "Chiều rộng tem",
                  "Kích thước cạnh ngang của 1 tem",
                  width,
                  setWidth,
                  "mm",
                  <Ruler size={22} />,
                )}
                {input(
                  "Chiều dài tem",
                  "Kích thước cạnh dài của 1 tem",
                  length,
                  setLength,
                  "mm",
                  <Tag size={22} />,
                )}
                {input(
                  "Giá giấy",
                  "Đơn giá vật liệu theo mét vuông",
                  paperPrice,
                  setPaperPrice,
                  "VND/m²",
                  <Stack size={22} />,
                )}
                {input(
                  "Phí gia công",
                  "Cộng vào đơn giá vật liệu theo m²",
                  processing,
                  setProcessing,
                  "VND/m²",
                  <Wrench size={22} />,
                )}
                {input(
                  "Số lượng tem",
                  "Số tem cần báo giá",
                  quantity,
                  setQuantity,
                  "tem",
                  <CirclesFour size={22} />,
                )}
                <div className="notice">
                  <Info size={19} />
                  <div>
                    <strong>Quy tắc đang áp dụng</strong>
                    <span>
                      Quy đổi mm² sang m² · Chưa bao gồm VAT · Tổng đơn hàng làm
                      tròn lên 1.000đ
                    </span>
                  </div>
                </div>
              </section>
              <section className="panel result-panel">
                <div className="panel-title">
                  <span className="result-number">2</span>
                  <div>
                    <h2>Kết quả tính toán</h2>
                    <p>Cập nhật ngay khi thay đổi thông số</p>
                  </div>
                </div>
                <div className="formula-box">
                  <div className="table-head">
                    <span>Hạng mục</span>
                    <span>Giá trị</span>
                  </div>
                  <div className="calc-row">
                    <span>Diện tích 1 tem</span>
                    <b>
                      {width || 0} × {length || 0} ={" "}
                      {(
                        displayPieceCalc.materialAreaM2 ?? displayPieceCalc.area
                      )
                        .toFixed(6)
                        .replace(".", ",")}{" "}
                      m²
                    </b>
                  </div>
                  <div className="calc-row">
                    <span>Giá giấy / m²</span>
                    <b>{money.format(parseMoneyInput(paperPrice))} VND/m²</b>
                  </div>
                  <div className="calc-row">
                    <span>Phí gia công / m²</span>
                    <b>{money.format(parseMoneyInput(processing))} VND/m²</b>
                  </div>
                  <div className="calc-row strong">
                    <span>Đơn giá áp dụng / m²</span>
                    <b>
                      {money.format(
                        displayPieceCalc.ratePerM2 ?? displayPieceCalc.rate,
                      )}{" "}
                      VND/m²
                    </b>
                  </div>
                  <div className="calc-row total">
                    <span>Đơn giá 1 tem (chưa VAT)</span>
                    <b>
                      {money.format(
                        displayPieceCalc.unitCost ?? displayPieceCalc.unit,
                      )}{" "}
                      đ
                    </b>
                  </div>
                  <div className="calc-row order">
                    <span>Tổng chi phí đơn hàng</span>
                    <b>
                      {fmt(
                        displayPieceCalc.orderCost ?? displayPieceCalc.order,
                      )}
                    </b>
                  </div>
                </div>
                <div className="price-card">
                  <div className="price-label">
                    ĐƠN GIÁ / TEM <small>(CHƯA VAT)</small>
                  </div>
                  <div className="price">
                    {money.format(
                      displayPieceCalc.unitCost ?? displayPieceCalc.unit,
                    )}{" "}
                    đ <span>/ tem</span>
                  </div>
                  <div className="price-meta">
                    <span>
                      <Info size={17} /> Chưa bao gồm VAT
                    </span>
                    <span>
                      <Calculator size={17} /> Tổng đơn hàng làm tròn 1.000đ
                    </span>
                  </div>
                </div>
                <div className="calc-actions">
                  <button
                    className="secondary-cta"
                    onClick={handlePreviewCalculationPdf}
                  >
                    <Printer size={18} /> Xem bản xem trước PDF
                  </button>
                  <button className="primary-cta" onClick={handleAddCalcToQuote}>
                    <FileText size={23} /> Tạo báo giá
                  </button>
                </div>
              </section>
            </div>
          ) : category === "tem" &&
            ["tem-roll-quantity", "tem-label-count"].includes(formula) ? (
            <div className="workspace">
              <section className="panel inputs-panel">
                <div className="panel-title">
                  <span>1</span>
                  <div>
                    <h2>Thông tin đầu vào</h2>
                    <p>
                      {formula === "tem-roll-quantity"
                        ? "Quy đổi số tem thành số mét rồi tính giá cuộn"
                        : "Tính số tem ra được từ chiều dài cuộn"}
                    </p>
                  </div>
                </div>
                {formula === "tem-roll-quantity" ? (
                  <>
                    {input(
                      "Chiều ngang tem",
                      "Tính khổ vật liệu (+5 mm)",
                      width,
                      setWidth,
                      "mm",
                      <Ruler size={22} />,
                    )}
                    {input(
                      "Chiều dọc tem",
                      "Quy đổi bước tem (+3 mm)",
                      length,
                      setLength,
                      "mm",
                      <Tag size={22} />,
                    )}
                    {input(
                      "Số tem / cuộn",
                      "Số tem khách cung cấp cho một cuộn",
                      labelsPerRoll,
                      setLabelsPerRoll,
                      "tem",
                      <CirclesFour size={22} />,
                    )}
                    {input(
                      "Giá giấy",
                      "Đơn giá vật liệu theo m²",
                      paperPrice,
                      setPaperPrice,
                      "VND/m²",
                      <Stack size={22} />,
                    )}
                    {input(
                      "Phí gia công",
                      "Chi phí gia công một cuộn",
                      processing,
                      setProcessing,
                      "VND/cuộn",
                      <Wrench size={22} />,
                    )}
                    {input(
                      "Số lượng cuộn",
                      "Số cuộn cần báo giá",
                      quantity,
                      setQuantity,
                      "cuộn",
                      <CirclesFour size={22} />,
                    )}
                  </>
                ) : (
                  <>
                    {input(
                      "Chiều dọc tem",
                      "Kích thước theo chiều chạy tem",
                      length,
                      setLength,
                      "mm",
                      <Tag size={22} />,
                    )}
                    {input(
                      "Chiều dài cuộn tem",
                      "Chiều dài thực tế của cuộn",
                      meters,
                      setMeters,
                      "m",
                      <ToiletPaper size={22} />,
                    )}
                  </>
                )}
                <div className="notice">
                  <Info size={19} />
                  <div>
                    <strong>Quy tắc đang áp dụng</strong>
                    <span>Biên cố định 3 mm · Chưa bao gồm VAT</span>
                  </div>
                </div>
              </section>
              <section className="panel result-panel">
                <div className="panel-title">
                  <span className="result-number">2</span>
                  <div>
                    <h2>Kết quả tính toán</h2>
                    <p>Cập nhật ngay khi thay đổi thông số</p>
                  </div>
                </div>
                {formula === "tem-roll-quantity" ? (
                  <>
                    <div className="formula-box">
                      <div className="table-head">
                        <span>Hạng mục</span>
                        <span>Giá trị</span>
                      </div>
                      <div className="calc-row">
                        <span>Số mét suy ra / cuộn</span>
                        <b>
                          ({length || 0} + 3) ÷ 1.000 × {labelsPerRoll || 0} ={" "}
                          {(
                            displayRollByCountCalc.derivedMeters ??
                            displayRollByCountCalc.derived_meters ??
                            0
                          )
                            .toFixed(2)
                            .replace(".", ",")}{" "}
                          m
                        </b>
                      </div>
                      <div className="calc-row">
                        <span>Diện tích vật liệu / cuộn</span>
                        <b>
                          {(
                            displayRollByCountCalc.materialAreaM2 ??
                            displayRollByCountCalc.area ??
                            0
                          )
                            .toFixed(2)
                            .replace(".", ",")}{" "}
                          m²
                        </b>
                      </div>
                      <div className="calc-row">
                        <span>Chi phí giấy / cuộn</span>
                        <b>
                          {money.format(
                            displayRollByCountCalc.paperCost ??
                              displayRollByCountCalc.paper ??
                              0,
                          )}{" "}
                          VND
                        </b>
                      </div>
                      <div className="calc-row total">
                        <span>Giá vốn / cuộn</span>
                        <b>
                          {fmt(
                            displayRollByCountCalc.unitCost ??
                              displayRollByCountCalc.unit ??
                              0,
                          )}
                        </b>
                      </div>
                      <div className="calc-row order">
                        <span>Tổng chi phí đơn hàng</span>
                        <b>
                          {fmt(
                            displayRollByCountCalc.orderCost ??
                              displayRollByCountCalc.order ??
                              0,
                          )}
                        </b>
                      </div>
                    </div>
                    <div className="price-card">
                      <div className="price-label">
                        ĐƠN GIÁ / CUỘN <small>(CHƯA VAT)</small>
                      </div>
                      <div className="price">
                        {fmt(
                          displayRollByCountCalc.unitCost ??
                            displayRollByCountCalc.unit ??
                            0,
                        )}{" "}
                        <span>/ cuộn</span>
                      </div>
                    </div>
                    <button
                      className="primary-cta"
                      onClick={handleAddCalcToQuote}
                    >
                      <FileText size={23} /> Tạo báo giá
                    </button>
                  </>
                ) : (
                  <>
                    <div className="formula-box">
                      <div className="table-head">
                        <span>Hạng mục</span>
                        <span>Giá trị</span>
                      </div>
                      <div className="calc-row">
                        <span>Bước tem</span>
                        <b>
                          ({length || 0} + 3) ÷ 1.000 ={" "}
                          {((Number(length) + 3) / 1000 || 0)
                            .toFixed(3)
                            .replace(".", ",")}{" "}
                          m
                        </b>
                      </div>
                      <div className="calc-row">
                        <span>Số tem lý thuyết</span>
                        <b>
                          {meters || 0} ÷{" "}
                          {((Number(length) + 3) / 1000 || 0)
                            .toFixed(3)
                            .replace(".", ",")}{" "}
                          ={" "}
                          {(
                            (Number(meters) || 0) /
                              (((Number(length) || 0) + 3) / 1000) || 0
                          )
                            .toFixed(2)
                            .replace(".", ",")}{" "}
                          tem
                        </b>
                      </div>
                      <div className="calc-row total">
                        <span>Số tem ra được / cuộn</span>
                        <b>
                          {money.format(
                            Math.floor(
                              (Number(meters) || 0) /
                                (((Number(length) || 0) + 3) / 1000) || 0,
                            ),
                          )}{" "}
                          tem
                        </b>
                      </div>
                    </div>
                    <div className="price-card">
                      <div className="price-label">SỐ TEM / CUỘN</div>
                      <div className="price">
                        {money.format(
                          Math.floor(
                            (Number(meters) || 0) /
                              (((Number(length) || 0) + 3) / 1000) || 0,
                          ),
                        )}{" "}
                        <span>tem</span>
                      </div>
                    </div>
                  </>
                )}
              </section>
            </div>
          ) : (
            <div className="pending-panel">
              <div className="pending-icon">
                <Info size={34} />
              </div>
              <h2>Chưa có công thức tính giá</h2>
              <p>
                Công thức này chưa được cấu hình. Vui lòng chờ dữ liệu nghiệp vụ
                hoặc chọn một phương án khác.
              </p>
              <span>Trạng thái: Đang cập nhật</span>
            </div>
          )}

          <footer className="content-footer">
            <span>
              <span className="status-dot" /> Sẵn sàng tính giá
            </span>
            <span>Phiên bản offline · Dữ liệu lưu trên máy này</span>
          </footer>
        </main>
      </div>

      {/* PRINT PREVIEW MODAL (Faithful to maubaogiakhachhang.pdf) */}
      {showPrintModal && (
        <div
          className="modal-overlay print-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closePrintPreview();
          }}
        >
          <div className="modal-content print-modal-content">
            <div className="print-modal-toolbar">
              <h2>Xem bản xem trước Báo Giá ({printPaperSize.toUpperCase()} PDF)</h2>
              <div className="print-modal-actions">
                <button
                  type="button"
                  className="btn-download-pdf"
                  onClick={handleDownloadPDF}
                >
                  <Download size={18} /> Tải file PDF (.pdf)
                </button>
                <div className="print-size-menu">
                  <button
                    type="button"
                    className="btn-print"
                    onClick={() => setIsPrintSizeMenuOpen((open) => !open)}
                    aria-expanded={isPrintSizeMenuOpen}
                  >
                    <Printer size={18} /> In {printPaperSize.toUpperCase()} <CaretDown size={14} />
                  </button>
                  {isPrintSizeMenuOpen && (
                    <div className="print-size-options" role="menu">
                      {Object.entries(PRINT_PAPER_SIZES).map(([value, paper]) => (
                        <button
                          key={value}
                          type="button"
                          className={value === printPaperSize ? "selected" : ""}
                          onClick={() => {
                            setPrintPaperSize(value);
                            setIsPrintSizeMenuOpen(false);
                            handlePrintQuote(value);
                          }}
                        >
                          <Printer size={14} /> In {value.toUpperCase()}
                          <small>{paper.label.split(" · ")[1]}</small>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={closePrintPreview}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Document Area */}
            <div className={`pdf-page-container printable-area paper-${printPaperSize}`}>
              {/* PDF Header Section */}
              <div className="pdf-header">
                <div className="pdf-brand-left">
                  <img
                    src="/unitech-stamp-logo.png"
                    alt="CÔNG TY CỔ PHẦN CÔNG NGHỆ UNITECH VIỆT NAM"
                    className="pdf-official-logo-img"
                  />
                </div>

                <div className="pdf-header-right">
                  <h1>CÔNG TY CỔ PHẦN CÔNG NGHỆ UNITECH VIỆT NAM</h1>
                  <p>
                    Địa chỉ: Cụm công nghiệp Thanh Oai, xã Bình Minh, TP. Hà Nội
                  </p>
                  <p>Website: http://www.unitechjsc.com</p>
                  <h2 className="pdf-title">BẢNG BÁO GIÁ</h2>
                </div>
              </div>

              {/* 2-Column Info Table Box */}
              <table className="pdf-info-box-table">
                <tbody>
                  <tr>
                    <td className="info-label-cell">Kính gửi</td>
                    <td className="info-value-cell bold-text">
                      {quoteForPrint.customerName ||
                        "CÔNG TY TRÁCH NHIỆM HỮU HẠN MỘT THÀNH VIÊN SEDO VINAKO"}
                    </td>
                    <td className="info-label-cell">Ngày báo giá</td>
                    <td className="info-value-cell">
                      {quoteForPrint.quoteDate}
                    </td>
                  </tr>
                  <tr>
                    <td className="info-label-cell">Địa chỉ</td>
                    <td className="info-value-cell">
                      {quoteForPrint.customerAddress || "—"}
                    </td>
                    <td className="info-label-cell">Người báo giá</td>
                    <td className="info-value-cell">
                      {quoteForPrint.salesName || "Mrs Ngân"}
                    </td>
                  </tr>
                  <tr>
                    <td className="info-label-cell">Email</td>
                    <td className="info-value-cell">
                      {quoteForPrint.customerEmail || "—"}
                    </td>
                    <td className="info-label-cell">Số điện thoại</td>
                    <td className="info-value-cell">
                      {quoteForPrint.salesPhone || "0961453395"}
                    </td>
                  </tr>
                  <tr>
                    <td className="info-label-cell">Số điện thoại</td>
                    <td className="info-value-cell">
                      {quoteForPrint.customerPhone || "—"}
                    </td>
                    <td className="info-label-cell">Email</td>
                    <td className="info-value-cell">
                      {quoteForPrint.salesEmail || "—"}
                    </td>
                  </tr>
                </tbody>
              </table>

              <p className="pdf-salutation">
                Công ty CP Công Nghệ Unitech Việt Nam xin gửi lời chào và lời
                chúc sức khỏe đến Quý khách hàng. Cảm ơn Quý khách đã quan tâm
                đến sản phẩm của chúng tôi. Chúng tôi rất hân hạnh được gửi đến
                Quý công ty báo giá sản phẩm theo nhu cầu như sau:
              </p>

              {/* PDF Items Table */}
              <table className="pdf-items-table">
                <thead>
                  <tr>
                    <th style={{ width: "35px" }}>STT</th>
                    <th style={{ width: "90px" }}>P/N</th>
                    <th>Miêu tả & thông số kỹ thuật</th>
                    <th style={{ width: "65px" }}>Số lượng</th>
                    <th style={{ width: "65px" }}>Đơn vị</th>
                    <th style={{ width: "110px" }} className="text-right">
                      Đơn giá VND/PCS
                    </th>
                    <th style={{ width: "120px" }} className="text-right">
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {quoteForPrint.items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="text-center">{idx + 1}</td>
                      <td className="font-mono">{item.pn}</td>
                      <td>{cleanBienText(item.desc)}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-center">{item.unit}</td>
                      <td className="text-right">
                        {money.format(item.unitPrice)}
                      </td>
                      <td className="text-right font-bold">
                        {money.format(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                  {/* VAT & Totals */}
                  <tr className="pdf-total-row">
                    <td colSpan={printPaperSize === "a6" ? "3" : "6"} className="text-right font-bold">
                      VAT {quoteForPrint.vatRate}%
                    </td>
                    <td className="text-right font-bold">
                      {money.format(printVatAmount)}
                    </td>
                  </tr>
                  <tr className="pdf-grand-total-row">
                    <td colSpan={printPaperSize === "a6" ? "3" : "6"} className="text-center font-bold">
                      Tổng tiền đã bao gồm VAT
                    </td>
                    <td className="text-right font-bold text-lg">
                      {money.format(printGrandTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Terms List */}
              <div className="pdf-terms">
                {quoteForPrint.terms.map((term, idx) => (
                  <p key={idx}>- {term}</p>
                ))}
              </div>

              {/* Signatures */}
              <div className="pdf-signatures">
                <div className="sig-block">
                  <strong>Đại diện bên mua</strong>
                </div>
                <div className="sig-block">
                  <strong>Đại diện bên bán</strong>
                </div>
              </div>

              {/* Footer Banner Image */}
              <div className="pdf-footer-banner">
                <img
                  src="/unitech-footer-banner.png"
                  alt="www.unitechjsc.com - Professionals"
                  className="pdf-footer-banner-img"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Custom Confirm Modal */}
      {confirmModal.isOpen && (
        <div
          className="modal-overlay confirm-modal-overlay"
          onClick={() =>
            setConfirmModal((prev) => ({ ...prev, isOpen: false }))
          }
        >
          <div
            className="confirm-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-modal-header">
              <div className="confirm-icon-badge">
                <WarningCircle size={22} weight="fill" />
              </div>
              <h3>{confirmModal.title || "Xác nhận thao tác"}</h3>
              <button
                type="button"
                className="btn-close-confirm"
                onClick={() =>
                  setConfirmModal((prev) => ({ ...prev, isOpen: false }))
                }
              >
                <X size={18} />
              </button>
            </div>
            <div className="confirm-modal-body">
              <p>{confirmModal.message}</p>
            </div>
            <div className="confirm-modal-actions">
              <button
                type="button"
                className="btn-confirm-cancel"
                onClick={() =>
                  setConfirmModal((prev) => ({ ...prev, isOpen: false }))
                }
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className={`btn-confirm-submit ${confirmModal.confirmVariant || "danger"}`}
                onClick={() => {
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                  setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                }}
              >
                {confirmModal.confirmText || "Đồng ý"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

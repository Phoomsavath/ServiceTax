import { ActiveState, Category, Group, PaidType, Unit } from "@prisma/client";

export const timeToken = 60 * 60 * 10; //10h ;
export const initialState = { success: false, message: "" };
export enum viewMode {
  List = "list",
  Create = "create",
  Edit = "edit",
  View = "view",
}

export const create = (message: string) => {
  return `ສ້າງ${message}ໃໝ່`;
};
export const edit = (message: string) => {
  return `ແກ້ໄຂ${message}`;
};

export const filter = (message: string) => {
  return `ຄົ້ນຫາ${message}`;
};
export const searchBy = (message: string) => {
  return `ຄົ້ນຫາຜ່ານ${message}`;
};

export enum PermissionConst {
  USER_VIEW = "USER_VIEW",
  USER_CREATE = "USER_CREATE",
  USER_UPDATE = "USER_UPDATE",
  USER_DELETE = "USER_DELETE",

  COMPANY_VIEW = "COMPANY_VIEW",
  COMPANY_CREATE = "COMPANY_CREATE",
  COMPANY_UPDATE = "COMPANY_UPDATE",
  COMPANY_DELETE = "COMPANY_DELETE",

  BILL_VIEW = "BILL_VIEW",
  BILL_CREATE = "BILL_CREATE",
  BILL_UPDATE = "BILL_UPDATE",
  BILL_DELETE = "BILL_DELETE",

  SALE_INVOICE_VIEW = "SALE_INVOICE_VIEW",
  SALE_INVOICE_CREATE = "SALE_INVOICE_CREATE",
  SALE_INVOICE_UPDATE = "SALE_INVOICE_UPDATE",
  SALE_INVOICE_DELETE = "SALE_INVOICE_DELETE",

  SERVICE_VIEW = "SERVICE_VIEW",
  SERVICE_CREATE = "SERVICE_CREATE",
  SERVICE_UPDATE = "SERVICE_UPDATE",
  SERVICE_DELETE = "SERVICE_DELETE",
}
export enum messageTranslation {
  Group = "ກຸ່ມ",
  DashBoard = "ສັງລວມ",
  Details = "ລາຍລະອຽດ",
  Set = "ເຊັດ",
  AdminOnly = "ສະເພາະແອັດມີນ",
  SettingStatus = "ຕັ້ງຄ່າການໃຊ້ງານ",
  SignIn = "ເຂົ້າສູ່ລະບົບ",
  SignInDuplicated = "ບັນຊີມີຄົນກຳລັງໃຊ້ງານຢູ່",
  SignInSuccess = "ເຂົ້າສູ່ລະບົບສຳເລັດ",
  SignInFailed = "ຊື່ຜູ້ໃຊ້ງານ ຫຼື ລະຫັດບໍ່ຖືກຕ້ອງກະລຸນາລອງໃຫມ່",
  Inactive = "ບັນຊິນີ້ຖືກປິດການໃຊ້ງານ",
  SignOut = "ອອກຈາກລະບົບ",
  Unique = "ຂໍ້ມູນນີ້ມີຢູ່ແລ້ວໃນລະບົບ ກະລຸນາກວດສອບຄືນ",
  Unknown = "ເກີດຂໍ້ຜິດພາດຈາກລະບົບ",
  NotFound = "ບໍ່ມີຂໍ້ມູນສ່ວນນີ້ໃນລະບົບ",
  NoData = "ບໍ່ມີຂໍ້ມູນ",
  DuplicatedDataUnique = "ຂໍ້ມູນນີ້ມີຢູ່ແລ້ວໃນລະບົບບໍ່ສາມາດສ້າງຊໍ້າໄດ້",
  Unauthorized = "ກະລຸນາເຂົ້າສູ່ລະບົບ",
  Forbidden = "ບໍ່ມີສີດເຂົ້າເຖິງສ່ວນນີ້",
  CreatedBy = "ສ້າງໂດຍ",
  UpdatedBy = "ແກ້ໄຂລ້າສຸດໂດຍ",
  FullName = "ຊຶ່ແລະນາມສະກຸນ",

  PromoteToInvoice = "ປ່ຽນເປັນໃບແຈ້ງໜີ້",
  PromoteToReceipt = "ປ່ຽນເປັນໃບເກັບຄ່າບໍລິການ",
  PaidStatus = "ສະຖານະການຈ່າຍເງິນ",
  UpdatedAt = "ວັນທີແກ້ໄຂລ່າສຸດ",

  CreatedSuccess = "ການສ້າງສຳເລັດ",
  CreateFailed = "ການສ້າງຜິດພາດ",
  UpdatedSuccess = "ການອັບເດດສຳເລັດ",
  UpdateFailed = "ການອັບເດດຜິດພາດ",
  DeletedSuccess = "ລົບສຳເລັດ",
  DeleteFailed = "ລົບຜິດພາດ",
  Total = "ລວມລາຍການ",
  Amount = "ຈຳນວນເງິນ",
  PaidAmount = "ຈ່າຍແລ້ວ",
  Cart = "ຕະກ້າ",
  Quantity = "ຈຳນວນ",
  TotalAmount = "ຈຳນວນເງິນທັງໝົດ",
  RemainingAmount = "ຈຳນວນເງິນທີ່ເຫຼືອ",
  Back = "ກັບຄືນ",
  DeliveryPoint = "ຈຸດສົ່ງ",
  SaleInvoice = "ໃບບີນ",
  Bill = "ໃບສຳລະ",
  Home = "ໜ້າຫຼັກ",
  Invoice = "ໃບແຈ້ງໜີ້",
  Quotation = "ໃບສະເໜີ",
  BillService = "ໃບວາງບິນ",
  ReceiptService = "ໃບເກັບຄ່າບໍລິການ",
  CreatedAt = "ວັນທິສ້າງ",
  BillServiceNo = "ເລກທີໃບວາງບິນ",
  ReceiptServiceNo = "ເລກທີໃບຮັບເງິນ",
  InvoiceNo = "ເລກທີໃບແຈ້ງໜີ້",
  QuotationNo = "ເລກທີໃບສະເໜີ",
  Stt = "ລຳດັບ",
  AllFiledRequired = "ກະລຸນາໃສ່ຂໍ້ມູນໃຫ້ຄົບຖ້ວນ",
  Placeholder = "ກະລຸນາຕື່ມຂໍ້ມູນ",
  ActiveStatus = "ສະຖານະການໃຊ້ງານ",
  Account = "ບັນຊິຜູ້ໃຊ້",
  Unit = "ຫົວໜ່ວຍ",
  Category = "ປະເພດ",
  Name = "ຊື່",
  Service = "ບໍລິການ",
  Phone = "ເບີຕິດຕໍ່",
  Address = "ທີ່ຢູ່",
  TaxNumber = "ເລກທະບຽນອາກອນ",
  ManagerContact = "ເບີຕົວແທນບໍລິສັດ",
  Email = "ອີເມວ",
  Code = "ລະຫັດການບໍລິການ",
  UserName = "ຊື່ຜູ້ໃ້ຊ້ງານ",
  Role = "ຕຳແໜ່ງ",
  Company = "ລູກຄ້າ",
  Password = "ລະຫັດ",
  ResetPassword = "ຣີເຊັດລະຫັດ",
  CurrentPassword = "ລະຫັດລ່າສຸດ",
  ConfirmNewPassword = "ຢືນຍັນລະຫັດອີກຄັ້ງ",
  ChangePassword = "ປ່ຽນລະຫັດໃໝ່",
  NewPassword = "ລະຫັດໃໝ່",
  MisMatch = "ລະຫັດໃໝ່ແລະລະຫັດຢືນຍັນບໍ່ຕົງກັນ",
  Relationship = "ຂໍ້ມູນນີ້ບໍ່ສາມາດລົບໄດ້ເນື່ອງຈາກວ່າມີການເຊື່ອມຂໍ້ມູນກັບພາກສ່ວນອຶ່ນຢູ່",

  Clear = "ລົບການຄົ້ນຫາ",
  Apply = "ກົດຄົ້ນຫາ",
  Require = "ໍຂໍ້ມູນໃສ່ບໍ່ຄົບກະລຸນາກວດຄືນ",
  Error = "ເກີດຂໍ້ຜິດພາດ",
  Warning = "ເຕືອນ",
  Success = "ສຳເລັດ",
  Processing = "ກຳລັງປະມວນຜົນ",
  Loading = "ກຳລັງໂຫຼດຂໍ້ມູນ",
  Cost = "ລາຄາເຮົາຈ່າຍ",
  Price = "ລາຄາເກັບນຳລູກຄ້າ",
  CostForCustomer = "ຕົ້ນທືນທີ່ຈ່າຍໃຫ້ເຈົ້າໜ້າທີ່",
  PriceForCustomer = "ລາຄາທີ່ເກັບນຳລູກຄ້າ",
  Create = "ສ້າງ",
  View = "ເບິ່ງ",
  Update = "ອັບເດັດ",
  Edit = "ແກ້ໄຂ",
  Delete = "ລົບ",
  Cancel = "ຍົກເລິກ",
  Submit = "ຢືນຍັນ",
}

export const CategoryTranslation: Record<Category, string> = {
  OFFICER_SERVICE: "ຄ່າຕຳຫຼວດ",
  TAX_SERVICE: "ຄ່າພາສີ",
  DELIVERY: "ຄ່າຂົນສົ່ງ",
  WAREHOUSE_SERVICE: "ຄ່າສາງ",
  GOVERNMENT_SERVICE: "ຄ່າແຈ້ງເອກະສານ",
  GOVERNMENT_VAT: "ອມພ",
  ETC: "ອື່ນ",
};
export const GroupTranslation: Record<Group, string> = {
  GROUP1: "ກຸ່ມ1",
  GROUP2: "ກຸ່ມ2",
  GROUP3: "ກຸ່ມ3",
};

export const PaidStatusTranslation: Record<PaidType, string> = {
  UNPAID: "ຄ້າງຈ່າຍ",
  PAID: "ຈ່າຍແລ້ວ",
};
export const activeStatusTranslation: Record<ActiveState, string> = {
  ACTIVE: "ເປີດການໃຊ້ງານ",
  INACTIVE: "ປິດການໃຊ້ງານ",
};

export const UnitTranslation: Record<Unit, string> = {
  CARS: "ຄັນ",
  FILES: "ຊຸດ",
  PAGES: "ໜ້າ",
  PERSON: "ຄົນ",
};

export enum Sets {
  "IM8_IMPORT" = "IM8_IMPORT",
  "IM4_IMPORT" = "IM4_IMPORT",
  "IM5_IMPORT" = "IM5_IMPORT",
  "EX8_EXPORT" = "EX8_EXPORT",
  "EX5_EXPORT" = "EX5_EXPORT",
  "EX4_EXPORT" = "EX4_EXPORT",
}

/**
 * SalesFlow CRM 领域模型定义
 * 对应《数据库设计说明书》SFS-CRM-DB-01 第 3 章逻辑表结构
 */

export type Role = 'SALES' | 'MANAGER' | 'FINANCE' | 'ADMIN';

export type UserStatus = 'ACTIVE' | 'DISABLED';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: Role;
  title: string;
  dept: string;
  phone: string;
  avatar: string;
  status: UserStatus;
  createdAt: string;
}

/* ---------------- 线索 ---------------- */

export type LeadStatus = 'NEW' | 'FOLLOWING' | 'CONVERTED' | 'LOST';
export type LeadLevel = 'HIGH' | 'MID' | 'LOW';

export interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  source: string;
  industry: string;
  level: LeadLevel;
  status: LeadStatus;
  ownerId: string | null;
  ownerName?: string;
  remark: string;
  lostReason?: string;
  createdBy: string;
  createdAt: string;
  nextFollowAt?: string;
  convertedAt?: string;
}

export type FollowUpType = '电话' | '拜访' | '邮件' | '微信' | '其他';

export interface FollowUp {
  id: string;
  leadId: string;
  type: FollowUpType;
  content: string;
  result: string;
  nextFollowAt?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

/* ---------------- 客户 ---------------- */

export type CustomerLevel = 'A' | 'B' | 'C';

export interface Customer {
  id: string;
  name: string;
  industry: string;
  level: CustomerLevel;
  levelAuto: boolean;
  source: string;
  ownerId: string;
  ownerName: string;
  address: string;
  website: string;
  totalAmount: number;
  createdAt: string;
  leadId?: string;
}

export interface Contact {
  id: string;
  customerId: string;
  name: string;
  title: string;
  phone: string;
  email: string;
  isPrimary: boolean;
}

/* ---------------- 商机 ---------------- */

export type Stage = 'S1' | 'S2' | 'S3' | 'S4' | 'S5';
export type OpportunityStatus = 'OPEN' | 'WON' | 'LOST';

export interface Opportunity {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  amount: number;
  stage: Stage;
  probability: number;
  expectedCloseDate: string;
  ownerId: string;
  ownerName: string;
  source: string;
  status: OpportunityStatus;
  lostReason?: string;
  competitor?: string;
  actualAmount?: number;
  closedAt?: string;
  createdAt: string;
  remark?: string;
}

export interface StageHistory {
  id: string;
  opportunityId: string;
  fromStage?: Stage;
  toStage: Stage;
  operatorId: string;
  operatorName: string;
  remark: string;
  createdAt: string;
}

/* ---------------- 产品 ---------------- */

export interface Product {
  id: string;
  name: string;
  spec: string;
  unit: string;
  price: number;
  category: string;
  status: 'ON_SALE' | 'OFF_SALE';
}

/* ---------------- 报价 ---------------- */

export type QuotationStatus =
  | 'DRAFT'
  | 'APPROVING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CONVERTED'
  | 'EXPIRED';

export interface QuotationItem {
  id: string;
  quotationId: string;
  productId: string;
  productName: string;
  spec: string;
  unit: string;
  price: number;
  quantity: number;
  discountRate: number;
  subtotal: number;
  netAmount: number;
}

export interface ApprovalStep {
  step: number;
  approverId: string;
  approverName: string;
  approverRole: Role;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment?: string;
  at?: string;
}

export interface Quotation {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  customerId: string;
  customerName: string;
  totalAmount: number;
  discountAmount: number;
  discountRate: number;
  validUntil: string;
  payMethod: string;
  status: QuotationStatus;
  approvalChain: ApprovalStep[];
  currentStep: number;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  remark: string;
}

export interface ApprovalRecord {
  id: string;
  bizType: 'QUOTATION';
  bizId: string;
  step: number;
  approverId: string;
  approverName: string;
  approverRole: Role;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  comment: string;
  createdAt: string;
}

/* ---------------- 订单 ---------------- */

export type OrderStatus = 'PENDING' | 'SIGNED' | 'EXECUTING' | 'COMPLETED' | 'CANCELLED';

export interface Order {
  id: string;
  quotationId?: string;
  customerId: string;
  customerName: string;
  contractNo: string;
  amount: number;
  signDate: string;
  deliveryDate?: string;
  payMethod: string;
  status: OrderStatus;
  paidAmount: number;
  ownerId: string;
  ownerName: string;
  auditBy?: string;
  auditByName?: string;
  auditAt?: string;
  remark: string;
  createdAt: string;
}

/* ---------------- 回款 ---------------- */

export type PlanStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE';

export interface PaymentPlan {
  id: string;
  orderId: string;
  orderNo: string;
  customerName: string;
  period: number;
  planAmount: number;
  planDate: string;
  paidAmount: number;
  status: PlanStatus;
}

export type PayMethod = '电汇' | '承兑' | '现金' | 'POS';

export interface Payment {
  id: string;
  orderId: string;
  orderNo: string;
  planId: string;
  customerName: string;
  amount: number;
  method: PayMethod;
  payDate: string;
  serialNo: string;
  status: 'REGISTERED' | 'CONFIRMED';
  invoiceNo: string;
  invoiceStatus: 'NONE' | 'ISSUED' | 'SENT';
  invoiceDate?: string;
  registeredBy: string;
  registeredByName: string;
  confirmedBy?: string;
  confirmedByName?: string;
  confirmedAt?: string;
  remark: string;
}

/* ---------------- 目标 ---------------- */

export interface Target {
  id: string;
  userId: string;
  userName: string;
  period: string;
  amount: number;
  achieved: number;
}

/* ---------------- 运行时 ---------------- */

export interface ActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  target: string;
  at: string;
}

export interface Database {
  version: number;
  users: User[];
  leads: Lead[];
  followUps: FollowUp[];
  customers: Customer[];
  contacts: Contact[];
  opportunities: Opportunity[];
  stageHistories: StageHistory[];
  products: Product[];
  quotations: Quotation[];
  quotationItems: QuotationItem[];
  approvalRecords: ApprovalRecord[];
  orders: Order[];
  paymentPlans: PaymentPlan[];
  payments: Payment[];
  targets: Target[];
  activityLogs: ActivityLog[];
}

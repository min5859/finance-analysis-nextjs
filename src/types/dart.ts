export interface DartCorpCode {
  corp_code: string;
  corp_name: string;
  stock_code: string;
  modify_date: string;
}

export interface DartFinancialItem {
  sj_div: 'BS' | 'IS' | 'CIS' | 'CF';
  account_id: string;
  account_nm: string;
  thstrm_amount: string;
  frmtrm_amount: string;
  bfefrmtrm_amount: string;
}

export interface DartFinancialResponse {
  status: string;
  message: string;
  list: DartFinancialItem[];
}

export interface DartCompanyInfo {
  corp_name: string;
  corp_name_eng: string;
  stock_name: string;
  stock_code: string;
  ceo_nm: string;
  corp_cls: string;
  induty_code: string;
  est_dt: string;
  acc_mt: string;
  [key: string]: string;
}

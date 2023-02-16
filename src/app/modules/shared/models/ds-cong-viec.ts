import { OvicFile } from "@core/models/file";

export interface DsCongViec {
  id?: number;
  ma_congviec: string;
  tenproject: string;
  tongquan: string;
  date_start: string;
  date_end: string;
  phongban: string;
  file_congviec: OvicFile[];
}

export interface PhongBan {
  id?: number;
  ten_phongban : string;
}



import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NotificationService } from '@core/services/notification.service';
import { DsCongViec } from '@modules/shared/models/ds-cong-viec';
import { chiTietGiaiDoan, giaiDoanCongViec } from '@modules/shared/models/giai-doan-cong-viec';
import { DsCongViecService } from '@modules/shared/services/ds-cong-viec.service';
import { GiaiDoanCongViecChiTietService } from '@modules/shared/services/giai-doan-cong-viec-chi-tiet.service';
import { GiaiDoanCongViecService } from '@modules/shared/services/giai-doan-cong-viec.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-thong-ke',
  templateUrl: './thong-ke.component.html',
  styleUrls: ['./thong-ke.component.css']
})
export class ThongKeComponent implements OnInit {
  @Output() needReloadData = new EventEmitter<string>();

  param_mcv: string = '';
  data_cv: DsCongViec[];
  data_gd: giaiDoanCongViec[];
  data_ctgd: chiTietGiaiDoan[];
  sumJobs = 0;
  sumJobs_ht = 0 ;
  percentValue : any = 0;

  constructor(
    public dsCongViecService: DsCongViecService,
    private giaiDoanCongViecService: GiaiDoanCongViecService,
    private giaiDoanCongViecChiTietService: GiaiDoanCongViecChiTietService,
    private notificationService: NotificationService,

    ) { }

  ngOnInit(): void {
    this.loadData();
    this.loadData_2();
  }

  loadData() {
    const filter = this.param_mcv ? { search: this.param_mcv.trim() } : null;
    this.dsCongViecService.list(1, filter).subscribe({
      next: dsChiTiet => {
        this.data_cv = dsChiTiet;
        this.showStatus(dsChiTiet);
      },
      error: () => {
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Lỗi không load được nội dung');
      }
    });
  }

  loadData_2() {
    const filter = this.param_mcv ? { search: this.param_mcv.trim() } : null;
    forkJoin([
      this.dsCongViecService.list(1, filter),
      this.giaiDoanCongViecService.list(1, filter),
      this.giaiDoanCongViecChiTietService.get_list_CTGD_count(),
    ]).subscribe(
      {
        next: ([dsCV, dsGDCV, dsCTGDCV]) => {
          this.notificationService.isProcessing(false);
          this.data_gd = dsGDCV.map(
            gDoan => {
              gDoan['data_giaidoan'] = dsCTGDCV.filter(m => m.id_giaidoan.toString() === gDoan.id.toString());
              // gDoan['count_chitietHT'] = dsCTGDCV.filter(m => m.trang_thai === 1 && m.id_giaidoan.toString() === gDoan.id.toString()).length;
              // gDoan['count_chitietCHT'] = dsCTGDCV.filter(m => m.trang_thai === 0 && m.id_giaidoan.toString() === gDoan.id.toString()).length;
              return gDoan;
            }
          );
          this.sumJobs = this.data_gd.reduce((collector, item) => collector += item['data_giaidoan'] ? item['data_giaidoan'].length : 0, 0);
          this.sumJobs_ht = this.data_gd.reduce((collector, item) => collector += (item['data_giaidoan'] && Array.isArray(item['data_giaidoan'])) ? item['data_giaidoan'].filter(r => r['trang_thai'] === 1).length : 0, 0);
          this.percentValue = ((this.sumJobs_ht * 100) / this.sumJobs).toFixed();
          console.log(this.data_gd);
          
        },
        error: (err: any) => {
          this.notificationService.isProcessing(false);
        },
      }
    )
  }
  showStatus(data) {
    data.forEach((f, key) => {
      if (new Date(f.date_start) < new Date()) {
        if (new Date(f.date_end) > new Date()) {
          f['bg_trangthai'] = 'bg-blue-500';
          f['trangthai_label'] = "Đang diễn ra";
        }
        else {
          f['bg_trangthai'] = 'bg-red-500';
          f['trangthai_label'] = "Đã quá hạn";
        }
      }
      else {
        f['bg_trangthai'] = 'bg-yellow-500';
        f['trangthai_label'] = "Chưa bắt đầu";
      }
    })
  }
}

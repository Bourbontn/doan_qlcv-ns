import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { DsCongViec } from '@modules/shared/models/ds-cong-viec';
import { chiTietGiaiDoan, giaiDoanCongViec } from '@modules/shared/models/giai-doan-cong-viec';
import { DsCongViecService } from '@modules/shared/services/ds-cong-viec.service';
import { GiaiDoanCongViecChiTietService } from '@modules/shared/services/giai-doan-cong-viec-chi-tiet.service';
import { GiaiDoanCongViecService } from '@modules/shared/services/giai-doan-cong-viec.service';
import { debounceTime, distinctUntilChanged, forkJoin, Subject } from 'rxjs';

@Component({
  selector: 'app-thong-ke',
  templateUrl: './thong-ke.component.html',
  styleUrls: ['./thong-ke.component.css']
})
export class ThongKeComponent implements OnInit {
  @Output() needReloadData = new EventEmitter<string>();
  search = '';
  param_mcv: string = '';
  data_cv: DsCongViec[];
  data_cv1: DsCongViec[];
  data_gd: giaiDoanCongViec[];
  data_ctgd: chiTietGiaiDoan[];
  sumJobs = 0;
  sumJobs_ht = 0;
  percentValue: any = 0;
  
  private OBSERVER_SEARCH_DATA = new Subject<string>();
  constructor(
    private auth: AuthService,
    private router: Router,
    public dsCongViecService: DsCongViecService,
    private giaiDoanCongViecService: GiaiDoanCongViecService,
    private giaiDoanCongViecChiTietService: GiaiDoanCongViecChiTietService,
    private notificationService: NotificationService,

  ) {
    this.OBSERVER_SEARCH_DATA.asObservable().pipe(distinctUntilChanged(), debounceTime(500)).subscribe(() => this.loadData_2());
   }

  ngOnInit(): void {
    // this.loadData();
    this.loadData_2();

    // console.log(this.auth.userCanAccess('cong-viec/thong-ke'));
    // console.log(this.auth.userCanAdd('cong-viec/thong-ke'));
    // console.log(this.auth.userCanEdit('cong-viec/thong-ke'));
    // console.log(this.auth.userCanDelete('cong-viec/thong-ke'));
  }

  loadData() {
    const filter = this.param_mcv ? { search: this.param_mcv.trim() } : null;
    this.dsCongViecService.list(1, filter).subscribe({
      next: dsChiTiet => {
        this.data_cv = dsChiTiet;
        // this.showStatus(dsChiTiet);
      },
      error: () => {
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Lỗi không load được nội dung');
      }
    });
  }
  loadData_2() {
    const filters = this.search ? { search: this.search.trim() } : null;
    forkJoin([
      this.dsCongViecService.list(1, filters),
      this.giaiDoanCongViecService.list(1, filters),
      this.giaiDoanCongViecChiTietService.get_list_CTGD_count(),
    ]).subscribe(
      {
        next: ([dsCV, dsGDCV, dsCTGDCV]) => {
          this.notificationService.isProcessing(false);
          this.data_cv1 = dsCV.map(
            cv => {
              const data_giai_doan = dsGDCV.filter(m => m.ma_congviec.toString() === cv.ma_congviec.toString()).map(
                m2 => {
                  m2['data_giaidoan_chi_tiet'] = dsCTGDCV.filter(m => m.id_giaidoan.toString() === m2.id.toString());
                  return m2;
                }
              );

              cv['data_giai_doan'] = data_giai_doan;

              const { done, sum }: { done: number, sum: number } = data_giai_doan.reduce((collector, gd) => {
                collector.done += gd['data_giaidoan_chi_tiet'].filter(i => i.trang_thai === 1).length;
                collector.sum += gd['data_giaidoan_chi_tiet'].length;
                return collector;
              }, { done: 0, sum: 0 });

              cv['__done'] = done;
              cv['__sum'] = sum;
              cv['__rate'] = sum ? ((done / sum) * 100).toFixed() : 0;

              let flag = false;
              if (new Date(cv.date_start) > new Date()) {
                cv['bg_trangthai'] = 'bg-yellow-500';
                cv['trangthai_label'] = "Chưa bắt đầu";
              } else {
                if (new Date(cv.date_end) > new Date()) {
                  cv['bg_trangthai'] = 'bg-blue-500';
                  cv['trangthai_label'] = "Đang diễn ra";
                  if (done === sum) {
                    flag = true;
                  }
                } else {
                  // cv['bg_trangthai'] = 'bg-red-500';
                  // cv['trangthai_label'] = "Đã quá hạn";
                  flag = true;
                }

                if (flag) {
                  if(sum){
                    cv['bg_trangthai'] = done === sum ? 'bg-green-500' : 'bg-red-500';
                    cv['trangthai_label'] = done === sum ? "Đã hoàn thành" : "Chưa hoàn thành";
                  }else{
                    // sum === 0
                    cv['bg_trangthai'] = 'bg-blue-500';
                  cv['trangthai_label'] = "Đang diễn ra";
                  }
                 
                }
              }


              // cv['__done_job'] = data_giai_doan.filter( item => item.trang_thai === 1).length;
              // this.showStatus(cv['data_giai_doan']);
              // this.showFinish(sum, done, cv,cv['data_giai_doan']);

              return cv;
            }
          );
        },
        error: (err: any) => {
          this.notificationService.isProcessing(false);
        },
      }
    )
  }
 

  toDetails(object: DsCongViec) {
    const code = this.auth.encryptData(`${object.ma_congviec}`);
    this.router.navigate(['/admin/cong-viec/chi-tiet-cong-viec'], { queryParams: { code } })
    // const url = this.router.serializeUrl(
    //   this.router.createUrlTree(['/admin/cong-viec/chi-tiet-cong-viec'], { queryParams: { code } })
    // );
    // console.log(code);
  }
  searchData() {
    this.OBSERVER_SEARCH_DATA.next(this.search);
  }
}

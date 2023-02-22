import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OvicFile } from '@core/models/file';
import { AuthService } from '@core/services/auth.service';
import { FileService } from '@core/services/file.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { DsCongViec, PhongBan } from '@modules/shared/models/ds-cong-viec';
import { chiTietGiaiDoan, giaiDoanCongViec } from '@modules/shared/models/giai-doan-cong-viec';
import { DsCongViecService } from '@modules/shared/services/ds-cong-viec.service';
import { GiaiDoanCongViecChiTietService } from '@modules/shared/services/giai-doan-cong-viec-chi-tiet.service';
import { GiaiDoanCongViecService } from '@modules/shared/services/giai-doan-cong-viec.service';
import { concat, debounceTime, distinctUntilChanged, forkJoin, Subject } from 'rxjs';

@Component({
  selector: 'app-chi-tiet-cong-viec',
  templateUrl: './chi-tiet-cong-viec.component.html',
  styleUrls: ['./chi-tiet-cong-viec.component.css']
})
export class ChiTietCongViecComponent implements OnInit {
  @ViewChild("cvFormEdit") cvFormEdit: TemplateRef<any>;
  @ViewChild('fileChooser') fileChooser: ElementRef<HTMLInputElement>;
  data_cv: DsCongViec[];
  data_gd: giaiDoanCongViec[];
  data_ctgd: chiTietGiaiDoan[];

  fileUploaded: OvicFile[] = [];
  uploadedFiles: any[] = [];

  dmpb: PhongBan[];
  param_mcv: string = '';
  sumJobs = 0;
  sumJobs_ht = 0;
  percentValue: any = 0;

  formState: {
    formType: 'add' | 'edit',
    showForm: boolean,
    formTitle: string,
    object: DsCongViec | null
  } = {
      formType: 'add',
      showForm: false,
      formTitle: '',
      object: null
    }
  formData: FormGroup = this.formBuilder.group({
    tenproject: ['', [Validators.required]],
    tongquan: ['', [Validators.required]],
    date_start: ['', [Validators.required]],
    date_end: ['', [Validators.required]],
    phongban: ['', [Validators.required]],
    file_congviec: []
  });

  private OBSERVER_SEARCH_DATA = new Subject<string>();



  constructor(
    public formBuilder: FormBuilder,
    public dsCongViecService: DsCongViecService,
    private giaiDoanCongViecService: GiaiDoanCongViecService,
    private giaiDoanCongViecChiTietService: GiaiDoanCongViecChiTietService,
    private auth: AuthService,
    private activateRoute: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService,
    private helperService: HelperService,
    private fileService: FileService,

  ) {
    this.OBSERVER_SEARCH_DATA.asObservable().pipe(distinctUntilChanged(), debounceTime(500)).subscribe(() => this.loadData_2());
  }

  ngOnInit(): void {
    this.activateRoute.queryParams.subscribe(params => {
      this.param_mcv = this.auth.decryptData(params['code']);
    })
    // this.loadData();
    this.getDvPhongBan();
    this.loadData_2();
  }

  // loadData() {
  //   const filter = this.param_mcv ? { search: this.param_mcv.trim() } : null;
  //   this.dsCongViecService.list(1, filter).subscribe({
  //     next: dsChiTiet => {
  //       this.data_cv = dsChiTiet;
  //       this.showStatus(dsChiTiet);
  //       this.loadFileJson(dsChiTiet);
  //       console.log(this.data_cv);

  //     },
  //     error: () => {
  //       this.notificationService.isProcessing(false);
  //       this.notificationService.toastError('Lỗi không load được nội dung');
  //     }
  //   });
  // }

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
          this.data_cv = dsCV;
          // this.showStatus(dsChiTiet);
          this.loadFileJson(dsCV);
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
          this.percentValue = this.sumJobs ? ((this.sumJobs_ht / this.sumJobs) *100 ).toFixed() : 0 ;
          this.showFinish(this.sumJobs_ht, this.sumJobs, dsCV);
        },
        error: (err: any) => {
          this.notificationService.isProcessing(false);
        },
      }
    )
  }

  showFinish(hoanthanh, tong, data) {
    data.forEach((f, key) => {
      if (new Date(f.date_start) < new Date()) {
        if (new Date(f.date_end) > new Date()) {
          f['bg_trangthai'] = 'bg-blue-500';
          f['trangthai_label'] = "Đang diễn ra";
          if(tong > 0 && tong === hoanthanh){
            f['bg_trangthai'] = 'bg-green-500';
            f['trangthai_label'] = "Đã hoàn thành";
          }
          else{
            f['bg_trangthai'] = 'bg-blue-500';
            f['trangthai_label'] = "Đang diễn ra";
          }
        }
        else {
          f['bg_trangthai'] = 'bg-red-500';
          f['trangthai_label'] = "Đã quá hạn";
          if(tong > 0 && tong === hoanthanh){
            f['bg_trangthai'] = 'bg-green-500';
            f['trangthai_label'] = "Đã hoàn thành";
          }
        }
      }
      else {
        f['bg_trangthai'] = 'bg-yellow-500';
        f['trangthai_label'] = "Chưa bắt đầu";
      }
    })
  }

  loadFileJson(object) {
    this.fileUploaded = object.file_quyetdinh && object.file_quyetdinh.length ? object.file_quyetdinh : [];
  }

  // showStatus(data) {
  //   data.forEach((f, key) => {
  //     if (new Date(f.date_start) < new Date()) {
  //       if (new Date(f.date_end) > new Date()) {
  //         f['bg_trangthai'] = 'bg-blue-500';
  //         f['trangthai_label'] = "Đang diễn ra";
  //       }
  //       else {
  //         f['bg_trangthai'] = 'bg-red-500';
  //         f['trangthai_label'] = "Đã quá hạn";
  //       }
  //     }
  //     else {
  //       f['bg_trangthai'] = 'bg-yellow-500';
  //       f['trangthai_label'] = "Chưa bắt đầu";
  //     }
  //   })
  // }
  backToList() {
    this.router.navigate(['/admin/cong-viec/thong-ke'])
  }

  //form gruop 
  onOpenFormEdit() {
    this.notificationService.openSideNavigationMenu({
      template: this.cvFormEdit,
      size: 550,
    })
  }
  changeInputMode(formType: 'add' | 'edit', object: DsCongViec | null = null) {
    this.formState.formTitle = formType === 'add' ? 'Thêm công việc' : 'Cập nhật công việc';
    this.notificationService.isProcessing(true);
    this.formState.formType = formType;
    if (formType === 'add') {
      this.notificationService.isProcessing(false);
      this.formData.reset(
        {
          tenproject: '',
          tongquan: '',
          date_start: '',
          date_end: '',
          phongban: '',
        }
      )
    } else {
      this.notificationService.isProcessing(false);
      this.formState.object = object;
      object.date_start = this.helperService.strToSQLDate(object.date_start)
      object.date_end = this.helperService.strToSQLDate(object.date_end)
      this.formData.reset({
        tenproject: object?.tenproject,
        tongquan: object?.tongquan,
        date_start: object?.date_start,
        date_end: object?.date_end,
        phongban: object?.phongban,
        file_congviec: object.file_congviec
      })
    }
  }
  btnEdit(object: DsCongViec) {
    this.onOpenFormEdit();
    this.changeInputMode('edit', object);
  }

  async btnDelete(data: DsCongViec) {
    const xacNhanXoa = await this.notificationService.confirmDelete();
    if (xacNhanXoa) {
      this.notificationService.isProcessing(true);
      this.dsCongViecService.deleteDanhSach(data.id).subscribe({
        next: () => {
          this.notificationService.isProcessing(false);
          this.backToList();
        },
        error: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastError('Thao tác thất bại');
        }
      });
    }
  }


  updateForm() {
    if (this.formData.valid) {
      if (this.formState.formType === 'add') {
        this.notificationService.isProcessing(true);
        // this.yeuCauService.add(this.formData.value).subscribe({
        //   next: () => {
        //     this.notificationService.isProcessing(false);
        //     this.notificationService.toastSuccess("thành công");
        //     this.loadData();
        //     this.formData.reset(
        //       {
        //         ma_ns: '',
        //         nam_congnhan: '',
        //         ten_trinhdo_tinhoc: '',
        //         loai: '',
        //         xeploai: '',
        //       }
        //     )
        //   }, error: () => {
        //     this.notificationService.isProcessing(false);
        //     this.notificationService.toastError("Thêm Trình độ tin học thất bại");
        //   }
        // })
      } else {
        this.notificationService.isProcessing(true);
        const index = this.data_cv.findIndex(r => r.id === this.formState.object.id);
        this.formData.value['date_start'] = this.helperService.strToSQLDate(this.formData.value['date_start']);
        this.formData.value['date_end'] = this.helperService.strToSQLDate(this.formData.value['date_end']);
        this.dsCongViecService.editDanhSach(this.data_cv[index].id, this.formData.value).subscribe({
          next: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastSuccess('Cập nhật thành công');
            this.loadData_2();

          }, error: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastError("Cập nhật thất bại thất bại");
          }
        })
      }
    }
    else {
      this.notificationService.toastError("Lỗi nhập liệu");
    }
  }
  btnCancel() {
    this.notificationService.closeSideNavigationMenu();
  }
  downloadFile(file: OvicFile) {
    this.notificationService.isProcessing(true);
    this.fileService.downloadWithProgress(file.id, file.title).subscribe();
    this.notificationService.isProcessing(false);

  }

  // deleteFile(file: OvicFile) {
  //   this.fileService.deleteFile(file.id).subscribe({
  //     next: () => {
  //       this.fileUploaded = this.fileUploaded.filter(f => f.id !== file.id);
  //       this.formData.get('file_quyetdinh').setValue(this.fileUploaded);
  //       this.notificationService.toastSuccess('xoá thành công');
  //     }, error: () => {
  //       this.notificationService.toastError('xoá file thất bại');
  //     }
  //   });
  // }

  //item dropdown phongban with database
  getDvPhongBan() {
    this.notificationService.isProcessing(true);
    this.dsCongViecService.getData_Phongban().subscribe({
      next: dsDvPhongBan => {
        this.dmpb = dsDvPhongBan;
        this.notificationService.isProcessing(false)
      }, error: () => {
        this.notificationService.isProcessing(false);
      }
    })
  }

  // thêm file 

  myUploader() {
    this.fileChooser.nativeElement.click();
  }
  fileChanges(event) {
    this.fileUploaded = [];
    if (event.target.files && event.target.files.length) {
      this.fileService.uploadFiles(event.target.files, this.auth.userDonViId, this.auth.user.id).subscribe({
        next: files => {
          this.formData.get('file_congviec').setValue(files);
          this.fileUploaded = files;
          event.target.files = null;
          this.notificationService.toastSuccess("Upload file thành công");
        },
        error: () => {
          this.notificationService.toastError("Upload file thất bại");
        }
      });
    }
    
  }

}

//giai đoạn công việc


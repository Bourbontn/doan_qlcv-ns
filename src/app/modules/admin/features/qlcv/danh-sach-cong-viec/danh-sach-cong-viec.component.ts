import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
import { debounceTime, distinctUntilChanged, forkJoin, Subject } from 'rxjs';

@Component({
  selector: 'app-danh-sach-cong-viec',
  templateUrl: './danh-sach-cong-viec.component.html',
  styleUrls: ['./danh-sach-cong-viec.component.css']
})
export class DanhSachCongViecComponent implements OnInit {
  @ViewChild('fileChooser') fileChooser: ElementRef<HTMLInputElement>;
  dmpb: PhongBan[];
  data_cv: DsCongViec[];
  data_full: DsCongViec[];
  data_gd: giaiDoanCongViec[];
  data_ctgd: chiTietGiaiDoan[];
  fileUploaded: OvicFile[] = [];
  uploadedFiles: any[] = [];

  ma_cv_auto: string = '';
  search = '';
  state;
  pageIndex = 0;
  pageSize = 10;
  pageNumber = 1;
  sumJobs = 0;
  sumJobs_ht = 0;
  percentValue: any = 0;
  selectedUser: any;
  fileUploading = false;

  dropdown = [
    { name: 'Chưa bắt đầu', value: 'unfulfilled' },
    { name: 'Đang diễn ra', value: 'processing' },
    { name: 'Đã quá hạn', value: 'expiration' },
  ]

  private OBSERVER_SEARCH_DATA = new Subject<string>();
  constructor(
    public formBuilder: FormBuilder,
    public dsCongViecService: DsCongViecService,
    private notificationService: NotificationService,
    private fileService: FileService,
    private auth: AuthService,
    private router: Router,
    private helperService: HelperService,
    private giaiDoanCongViecService: GiaiDoanCongViecService,
    private giaiDoanCongViecChiTietService: GiaiDoanCongViecChiTietService,
  ) {
    this.OBSERVER_SEARCH_DATA.asObservable().pipe(distinctUntilChanged(), debounceTime(500)).subscribe(() => this.loadData_2());
  }
  permission = {
    isExpert: false,
    canAdd: false,
    canEdit: false,
    canDelete: false,
  }

  ngOnInit(): void {
    this.loadData_2();
    this.getDvPhongBan();
    console.log(this.auth.roles);
    
    const isStaffExpert = this.auth.roles.reduce((collector, role) => collector || role['name'] === 'dans_lanh_dao', false);

    this.permission.isExpert = isStaffExpert;
    this.permission.canAdd = isStaffExpert;
    this.permission.canEdit = isStaffExpert;
    this.permission.canDelete = isStaffExpert;
  }

  formData: FormGroup = this.formBuilder.group({
    ma_congviec: [''],
    tenproject: ['', [Validators.required]],
    tongquan: ['', [Validators.required]],
    date_start: ['', [Validators.required]],
    date_end: ['', [Validators.required]],
    phongban: ['', [Validators.required]],
    file_congviec: [],
  });

  loadData() {
    const filter = this.search ? { search: this.search.trim() } : null;
    this.notificationService.isProcessing(true);
    this.dsCongViecService.list(1, filter).subscribe({
      next: hienThiDanhSachCongViec => {
        this.notificationService.isProcessing(false);
        hienThiDanhSachCongViec.forEach((f) => {
          this.ma_cv_auto = 'mcv' + [f.id + 1];
        });
        this.pageNumber = hienThiDanhSachCongViec.length;
        this.pageIndex = 0;
        this.data_full = hienThiDanhSachCongViec;
        this.data_cv = [];
        
        // this.data_full.forEach((f, key) => {
        //   if (key >= this.pageIndex && this.data.length < this.pageSize)
        //     this.data.push(f);
        // })
        this.data_cv = [...this.data_full].splice(this.pageIndex, this.pageSize)
        this.showStatus(hienThiDanhSachCongViec);
      },
      error: () => {
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Lỗi không load được nội dung');
      }
    });
  }
  searchData() {
    this.OBSERVER_SEARCH_DATA.next(this.search);
  }


  loadData_2() {
    const filter = this.search ? { search: this.search.trim() } : null;
    forkJoin([
      this.dsCongViecService.list(1, filter),
      this.giaiDoanCongViecService.list(1, filter),
      this.giaiDoanCongViecChiTietService.get_list_CTGD_count(),
    ]).subscribe(
      {
        next: ([dsCV, dsGDCV, dsCTGDCV]) => {
          this.notificationService.isProcessing(false);
          this.data_cv = dsCV;
          dsCV.forEach((f) => {
            this.ma_cv_auto = 'mcv' + [f.id + 1];
          });
          this.pageNumber = dsCV.length;
          this.pageIndex = 0;
          this.data_full = dsCV;
          this.data_cv = [];
          
          // this.data_full.forEach((f, key) => {
          //   if (key >= this.pageIndex && this.data.length < this.pageSize)
          //     this.data.push(f);
          // })
          this.data_cv = [...this.data_full].splice(this.pageIndex, this.pageSize)
          // this.showStatus(dsChiTiet);
          // this.loadFileJson(dsCV);
          // this.data_gd = dsGDCV.map(
          //   gDoan => {
          //     gDoan['data_giaidoan'] = dsCTGDCV.filter(m => m.id_giaidoan.toString() === gDoan.id.toString());
          //     // gDoan['count_chitietHT'] = dsCTGDCV.filter(m => m.trang_thai === 1 && m.id_giaidoan.toString() === gDoan.id.toString()).length;
          //     // gDoan['count_chitietCHT'] = dsCTGDCV.filter(m => m.trang_thai === 0 && m.id_giaidoan.toString() === gDoan.id.toString()).length;
          //     return gDoan;
          //   }
          // );
          // this.sumJobs = this.data_gd.reduce((collector, item) => collector += item['data_giaidoan'] ? item['data_giaidoan'].length : 0, 0);
          // this.sumJobs_ht = this.data_gd.reduce((collector, item) => collector += (item['data_giaidoan'] && Array.isArray(item['data_giaidoan'])) ? item['data_giaidoan'].filter(r => r['trang_thai'] === 1).length : 0, 0);
          // this.percentValue = ((this.sumJobs_ht * 100) / this.sumJobs).toFixed();
          // this.showFinish(this.sumJobs_ht, this.sumJobs, dsCV);
          // console.log(this.data_cv);
          // console.log(this.data_gd);
          
          // this.showStatus(dsCV);

          // this.data_cv = dsCV.map(
          //   cv =>{
          //     cv['data_cv'] = dsGDCV.filter(m => m.ma_congviec.toString() === cv.ma_congviec.toString());
          //     return cv;
          //   }
          // );
          
          this.data_gd = dsGDCV.map(
              gd => {
                gd['data_giaidoan'] = dsCTGDCV.filter(m => m.id_giaidoan.toString() === gd.id.toString());
                return gd;
              }
            );

          // this.sumJobs = this.data_gd.reduce((collector, item) => collector += item['data_cv'] ? item['data_cv'].length : 0, 0);
          this.sumJobs_ht = this.data_gd.reduce((collector, item) => collector += (item['data_cv'] && Array.isArray(item['data_cv'])) ? item['data_cv'].filter(r => r['trang_thai'] === 1).length : 0, 0);
          // this.percentValue = ((this.sumJobs_ht * 100) / this.sumJobs).toFixed();
          // this.showFinish(this.sumJobs_ht, this.sumJobs, dsCV);
          

        },
        error: (err: any) => {
          this.notificationService.isProcessing(false);
        },
      }
    )
  }

  showFinish(hoanthanh, tong, data) {
    // if (hoanthanh === tong) {
    //   console.log("đã hoàn thành");
    //   data.forEach((f, key) => {
    //     f['bg_trangthai'] = 'bg-green-500';
    //     f['trangthai_label'] = "Đã hoàn thành";
    //   }
    //   )
    // }
    // else {
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
        }
      }
      else {
        f['bg_trangthai'] = 'bg-yellow-500';
        f['trangthai_label'] = "Chưa bắt đầu";
      }
    })
    // }
  }



  async btnDelete(data: DsCongViec) {
    const xacNhanXoa = await this.notificationService.confirmDelete();
    if (xacNhanXoa) {
      this.notificationService.isProcessing(true);
      this.dsCongViecService.deleteDanhSach(data.id).subscribe({
        next: () => {
          this.notificationService.isProcessing(false);
          this.loadData();
        },
        error: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastError('Thao tác thất bại');
        }
      });
    }
  }

  submitForm() {
    this.formData.value['ma_congviec'] = this.ma_cv_auto;
    if (this.formData.valid) {
      this.notificationService.isProcessing(true);
      this.formData.value['date_start'] = this.helperService.strToSQLDate(this.formData.value['date_start']);
      this.formData.value['date_end'] = this.helperService.strToSQLDate(this.formData.value['date_end']);
      this.dsCongViecService.createDanhSach(this.formData.value).subscribe({
        next: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastSuccess("Tạo mới công việc thành công");
          this.loadData();
          this.formData.reset({
            ma_congviec: this.ma_cv_auto,
            tenproject: '',
            tongquan: '',
            phongban: '',
            file_congviec: [],
          }
          )
          this.fileUploaded = [];
        },
        error: () => {
          this.notificationService.toastError('Tạo mới công việc thất bại');
          this.notificationService.isProcessing(false);
        }
      })
    } else {
      this.notificationService.toastError('Lỗi nhập liệu');
    }
  }

  toDetails(object: DsCongViec) {
    const code = this.auth.encryptData(`${object.ma_congviec}`);
    this.router.navigate(['/admin/cong-viec/chi-tiet-cong-viec'], { queryParams: { code } })
    // const url = this.router.serializeUrl(
    //   this.router.createUrlTree(['/admin/cong-viec/chi-tiet-cong-viec'], { queryParams: { code } })
    // );
    // console.log(code);
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
        f['trangthai_label'] = "Chưa diễn ra";
      }
    })
  }

  changesPage(event) {
    this.data_cv = [];
    // this.data_full.forEach((f, key) => {
    //   if (key >= event.pageIndex*this.pageSize && this.data.length < this.pageSize)
    //     this.data.push(f);
    // })   
    this.data_cv = [...this.data_full].splice(event.pageIndex * this.pageSize, this.pageSize)
  }

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

  myUploader() {
    this.fileChooser.nativeElement.click();
  }
  //delete file in Media
  deleteFile(file: OvicFile) {
    this.fileService.deleteFile(file.id).subscribe({
      next: () => {
        this.fileUploaded = this.fileUploaded.filter(f => f.id !== file.id);
        this.formData.get('file_congviec').setValue(this.fileUploaded);
        this.notificationService.toastSuccess('xoá thành công');
      }, error: () => {
        this.notificationService.toastError('xoá file thất bại');
      }
    });
  }
  //up file vào cột dữ liệu = Json
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

  // dropDownPB( {value} : { value : number}){
  //   this.formData.get('phongban').setValue(this.dmpb.find( p => p.id === value).ten_phongban);
  // }
  // onBasicUpload({ files }: { files: FileList }) {
  //   if (files && files.length) {
  //     const lenght = files.length;
  //     let counter = 0;
  //     this.fileUploading = true;
  //     Array.from(files).forEach((file: File, index: number) => {
  //       setTimeout(() => this.fileService.uploadFileOfDonviNew([file], this.auth.userDonViId, this.auth.user.id).subscribe({
  //         next: (info) => {
  //           if (++counter === lenght) {
  //             this.fileUploading = false;
  //           }
  //           console.log(info);
  //         },
  //         error: (res) => {
  //           if (++counter === lenght) {
  //             this.fileUploading = false;
  //           }
  //         },
  //       }), index * 100);
  //     });
  //   }
  // }
}

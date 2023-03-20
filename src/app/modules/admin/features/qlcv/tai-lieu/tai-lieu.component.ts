import { state, style, trigger } from '@angular/animations';
import { OverlayRef } from '@angular/cdk/overlay';
import { Component, OnInit, Input, ViewChild, ElementRef, SimpleChanges, OnChanges, TemplateRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OvicFile, OvicDocumentDownloadResult, OvicDocumentTypes } from '@core/models/file';
import { AuthService } from '@core/services/auth.service';
import { FileService } from '@core/services/file.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { DsCongViec } from '@modules/shared/models/ds-cong-viec';
import { DsCongViecService } from '@modules/shared/services/ds-cong-viec.service';
import { distinctUntilChanged, finalize, mergeMap, Observable, Subject, Subscription } from 'rxjs';

interface DocumentPack {

    lessonDocuments: OvicFile[];
    lessonAudio: OvicFile[];
    lessonSlide: OvicFile[];
    classDocuments: OvicFile[];
    classDecuong: OvicFile[];
}

enum RightContextMenuFunction {
    detail = 'detail',
    download = 'download',
    preview = 'preview',
    rename = 'rename'
}

@Component({
    selector: 'app-tai-lieu',
    templateUrl: './tai-lieu.component.html',
    styleUrls: ['./tai-lieu.component.css'],
    animations: [
        trigger('menuPanel', [
            state('open', style({ 'left': '0' })),
            state('closed', style({ 'left': '-320px' }))
        ]),
        trigger('overlay', [
            state('open', style({
                'z-index': '999',
                'visibility': 'visible',
                'opacity': '1'
            })),
            state('closed', style({
                'z-index': '-100',
                'visibility': 'hidden',
                'opacity': '0'
            }))
        ])
    ]
})
export class TaiLieuComponent implements OnInit {
    library: 'MY_DOCUMENT' | 'CLASS_DOCUMENT' = 'MY_DOCUMENT';
    libraryName = {
        MY_DOCUMENT: 'Tên công việc',
        CLASS_DOCUMENT: 'Tên công việc'
    };
    search = '';
    data_cv: DsCongViec[];
    listModeActivated = false;

    showClearSearch = false;
    @ViewChild('searchText') searchInput: ElementRef;
    @ViewChild('fileChooser') fileChooser: ElementRef<HTMLInputElement>;
    permission = {
        isExpert: false,
        canAdd: false,
        canEdit: false,
        canDelete: false,
    }

    // oauthInfo : OAuthData;
    hiddenLayout;
    userId: number;

    rootFolder: string;

    metaKeyStore = '__store_dir';

    btnLoadMore = '';

    panelLoading = false;

    personalData: OvicFile[];

    limit = 100;

    studentClassesActive: DsCongViec;

    // courseInfo : Courses;

    documentPack;

    startPreview = false;

    // mediaSource : Plyr.Source[];

    textContent: string;

    mediaType: OvicDocumentTypes;

    // uploadingFiles : OvicFileUpload[] = [];

    // acceptList = new Set( LIST_OF_ACCEPTED_FILE_EXTENSIONS );

    _f_id = 100;

    showUploadPanel = false;

    timeoutUpdateAfterUploaded: any;

    @ViewChild('fileChooser') inputFileChooser: ElementRef<HTMLInputElement>;

    subscription: Subscription;

    userTouched = false;

    overlayRef: OverlayRef | null;

    contextMenuFunction = RightContextMenuFunction;

    subMenuOpenLeft = false;

    // _fileRunning : OvicDriveFile;

    idFileEditName = '';
    @ViewChild('userMenu') userMenu: TemplateRef<any>;

    isMobile = false;

    menuPanelState: 'closed' | 'open' = 'closed';

    emptyStore = false;

    isCreatingStore = false;

    createdStoreMessage = false;

    studentClasses: DsCongViec[];

    searchRequest$: Subject<string> = new Subject<string>();

    // private OBSERVER_SEARCH_DATA = new Subject<string>();
    param_mcv: string = '';

    constructor(
        private fileService: FileService,
        private helperService: HelperService,
        private notificationService: NotificationService,
        public dsCongViecService: DsCongViecService,
        private auth: AuthService,
        private activateRoute: ActivatedRoute,
    ) {
        // this.OBSERVER_SEARCH_DATA.asObservable().pipe(distinctUntilChanged(), debounceTime(500)).subscribe(() => this.loadData_2());

    }

    ngOnInit() {
        this.loadLibrary();
        this.checkRole();
    }

    checkRole() {
        const isStaffExpert = this.auth.roles.reduce((collector, role) => collector || role['name'] === 'dans_lanh_dao', false);
        this.permission.isExpert = isStaffExpert;
        this.permission.canAdd = isStaffExpert;
        this.permission.canEdit = isStaffExpert;
        this.permission.canDelete = isStaffExpert;

    }

    disableContextMenu(event: Event) {
        event.preventDefault();
        event.stopPropagation();
        return;
    }
    //load file theo mục chọn
    changeLibrary(library: 'MY_DOCUMENT' | 'CLASS_DOCUMENT') {
        // this.closeUploadFile();
        if (this.library !== library) {
            this.library = library;
            this.loadLibrary();
        }
    }

    loadLibrary() {
        this.idFileEditName = '';
        this.studentClassesActive = null;
        this.studentClasses = [];
        this.personalData = [];
        this.documentPack = null;
        this.dsCongViecService.list(1).subscribe(
            classes => {
                // const studentClasses = [].concat( JSON.parse( JSON.stringify( classes ) ) , JSON.parse( JSON.stringify( classes ) ) , JSON.parse( JSON.stringify( classes ) ) , JSON.parse( JSON.stringify( classes ) ) , JSON.parse( JSON.stringify( classes ) ) , JSON.parse( JSON.stringify( classes ) ) , JSON.parse( JSON.stringify( classes ) ) , JSON.parse( JSON.stringify( classes ) ) , JSON.parse( JSON.stringify( classes ) ) );
                this.studentClasses = classes.map(c => {
                    c['__custom_name'] = c.tenproject.split('(')[0];
                    c['__teacher'] = c.phongban.split('*')[0];
                    return c;
                });

            },
            () => this.notificationService.toastError('Lỗi kết nối server')
        );
    }

    activeStudentClasses(c: DsCongViec) {
        if (this.studentClassesActive) {
            if (this.studentClassesActive.id === c.id) {
                return;
            }
            this.studentClassesActive['__active'] = false;
        }
        c['__active'] = true;
        this.studentClassesActive = c;
        this.loadClassDocuments(c);

    }
    loadClassDocuments(c: DsCongViec) {
        this.documentPack = true;
        const a = c.ma_congviec;
        this.notificationService.isProcessing(true);
        this.dsCongViecService.list(1).subscribe({
            next: r => {
                this.data_cv = r.filter(r => r.ma_congviec === a);
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError('Lỗi không load được nội dung');
            }
        });

    }

    activeListMode(active: boolean) {
        this.listModeActivated = active;
        this.hiddenLayout = active;
    }

    searchData() {
        if (!!(this.searchInput && this.searchInput.nativeElement.value.length)) {
            this.showClearSearch = true;
            this.searchRequest$.next(this.searchInput.nativeElement.value);
        } else {
            this.showClearSearch = false;
            this.searchRequest$.next('');
        }
    }
    clearSearch() {
        this.showClearSearch = false;
        this.searchInput.nativeElement.value = '';
        this.loadLibrary();
    }
    fileTrackBy(index, file: OvicFile) {
        return file.id;
    }

    downloadFile(file: OvicFile) {
        this.notificationService.isProcessing(true);
        setTimeout(() => {
            this.fileService.downloadWithProgress(file.id, file.title).subscribe();
            this.notificationService.isProcessing(false);
        }, 1000);


    }

    openFilre(file: OvicFile) {
        this.fileService.getImageContent(file.id.toString(10)).subscribe({
            next: blob => {
                window.open(blob, '_blank',);
            },
            error: () => { },
        });
    }

    myUploader() {
        this.fileChooser.nativeElement.click();
    }

    fileChanges(event) {
        if (event.target.files && event.target.files.length) {
            this.fileService.uploadFiles(event.target.files, this.auth.userDonViId, this.auth.user.id).subscribe({
                next: files => {
                    const index = this.data_cv.findIndex(r => r.ma_congviec);
                    const uploadedFiles: OvicFile[] = this.data_cv[index].file_congviec || [];
                    const newFiles: OvicFile[] = [].concat(uploadedFiles, files);
                    this.updateFileForJob(this.data_cv[index], newFiles);
                    this.notificationService.isProcessing(true);
                },
                error: () => {
                    this.notificationService.toastError("Thêm file thất bại");
                }
            });
        }

    }

    updateFileForJob(job: DsCongViec, files: OvicFile[]) {
        this.notificationService.isProcessing(true);
        this.dsCongViecService.editDanhSach(job.id, { file_congviec: files }).subscribe({
            next: () => {
                job.file_congviec = files;
                this.notificationService.isProcessing(false);
                this.notificationService.toastSuccess('Cập nhật thành công');
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError('Cập nhật file thất bại');
            },
        });
    }


}



import { Component, OnInit } from '@angular/core';
import { DropdownOptions } from '@shared/models/dropdown-options';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';
import { AutoUnsubscribeOnDestroy } from '@core/utils/decorator';
import { NotificationService } from '@core/services/notification.service';
import { HelperService } from '@core/services/helper.service';
import { Router } from '@angular/router';
import { DsCongViecService } from '@modules/shared/services/ds-cong-viec.service';
import { DsCongViec } from '@modules/shared/models/ds-cong-viec';
import { GiaiDoanCongViecChiTietService } from '@modules/shared/services/giai-doan-cong-viec-chi-tiet.service';
import { chiTietGiaiDoan } from '@modules/shared/models/giai-doan-cong-viec';

@AutoUnsubscribeOnDestroy()
@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
	data: any;
	basicData: any;
	basicOptions: any;
	chartOptions: any;

	data_cv: DsCongViec[];
	data_ctgd: chiTietGiaiDoan[];
	sum_cv: any;
	sum_cvFinished: any;
	sum_cvUnFinished: any;


	departments: DropdownOptions[] = [
		{ name: 'Khoa Công nghệ thông tin', value: '100', key: 'donvi_id' },
		{ name: 'Khoa Điện tử viễn thông', value: '101', key: 'donvi_id' },
		{ name: 'Khoa Công nghệ Tự động hóa', value: '102', key: 'donvi_id' },
		{ name: 'Khoa Tin học kinh tế', value: '103', key: 'donvi_id' }
	];
	selectedDepartment: DropdownOptions;

	years: DropdownOptions[] = [
		{ name: '2018', value: '2018', key: 'namhoc' },
		{ name: '2019', value: '2019', key: 'namhoc' },
		{ name: '2020', value: '2020', key: 'namhoc' },
		{ name: '2021', value: '2021', key: 'namhoc' },
		{ name: '2022', value: '2022', key: 'namhoc' },
		{ name: '2023', value: '2023', key: 'namhoc' }
	];
	selectedYear: DropdownOptions;

	semesters: DropdownOptions[] = [
		{ name: 'Học kỳ 1', value: '1', key: 'hocky' },
		{ name: 'Học kỳ 2', value: '2', key: 'hocky' },
		{ name: 'Học kỳ 3', value: '3', key: 'hocky' },
		{ name: 'Cả năm', value: '4', key: 'hocky' }
	];
	selectedSemester: DropdownOptions;

	subscription = new Subscription();

	searchText: string = '';

	private readonly OBSERVER_SEARCH_DATA = new Subject();

	private readonly OBSERVER_ON_TYPE_SEARCH_TEXT = new Subject<string>();

	constructor(
		private dsCongViec: DsCongViecService,
		private notificationService: NotificationService,
		private helperService: HelperService,
		private router: Router,
		private giaiDoanCongViecChiTietService: GiaiDoanCongViecChiTietService,

	) {
	}


	ngOnInit(): void {
		this.loadData();
		this.hello();
		this.basicData = {
			labels: ['Tháng', 'Năm',],
			datasets: [
				{
					label: 'Tổng công việc hoàn thành',
					backgroundColor: '#42A5F5',
					data: [438, 3547]
				},
				{
					label: 'Tổng số công việc ',
					backgroundColor: '#FFA726',
					data: [592, 3670]
				}
			]

		}
		this.data = {
			labels: ['Tổng số công việc', 'Tổng số HTKT đã khen', 'Tổng số khen kháng chiến'],
			datasets: [
				{
					data: [50, 90],
					backgroundColor: [
						"#42A5F5",
						"#66BB6A",
						"#FFA726"
					],
					hoverBackgroundColor: [
						"#64B5F6",
						"#81C784",
						"#FFB74D"
					]
				}
			]

		}
		const observeSearchData = this.OBSERVER_SEARCH_DATA.asObservable().pipe(debounceTime(200)).subscribe(() => this.search());
		this.subscription.add(observeSearchData);

		const observeTypeSearchText = this.OBSERVER_ON_TYPE_SEARCH_TEXT.asObservable().pipe(debounceTime(500), distinctUntilChanged()).subscribe(() => this.search());
		this.subscription.add(observeTypeSearchText);

	}

	search() {
		const query = [{ key: 'search_text', value: this.searchText }, this.selectedDepartment, this.selectedYear, this.selectedSemester].map(({ key, value }) => key + '=' + value).join('&');
		
	}

	onTypeSearchText(event: Event) {
		event.stopPropagation();
		this.OBSERVER_ON_TYPE_SEARCH_TEXT.next(this.searchText);
	}

	searching() {
		this.OBSERVER_ON_TYPE_SEARCH_TEXT.next(this.searchText);
	}
	loadData() {
		this.dsCongViec.list(1).subscribe({
			next: dscv => {
				this.data_cv = dscv;
				this.sum_cv = this.data_cv.length.toString();

			},
			error: () => {
				this.notificationService.isProcessing(false);
				this.notificationService.toastError('Lỗi không load được nội dung');
			}
		});

		this.giaiDoanCongViecChiTietService.list(1).subscribe({
			next: r => {
				this.data_ctgd = r;
				this.sum_cvFinished = this.data_ctgd.filter(r => r.trang_thai === 1).length.toString();
				this.sum_cvUnFinished = this.data_ctgd.filter(r => r.trang_thai === 0).length.toString();
			},
			error: () => { }
		});

	}
	movetoDSCV() {
		this.router.navigate(['/admin/cong-viec/danh-sach-cong-viec'])
	}
	movetoThongke() {
		this.router.navigate(['/admin/cong-viec/thong-ke'])
	}
	movetoQLTaiLieu() {
		this.router.navigate(['/admin/cong-viec/quan-ly-tai-lieu'])
	}
	
	students = [
		{
			id: 1,
			name: ' nguyen van a',
			courese: 'k45'
		},
		{
			id: 2,
			name: ' nguyen van b',
			courese: 'k41'
		},
		{
			id: 3,
			name: ' nguyen van c',
			courese: 'k45'
		}
	];
	
	hello(){
		const a = this.students.filter(r=> r.courese === 'k45');
		const b = this.students.map(r => r.name)
		console.log(b);
		
	}


}

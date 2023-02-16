import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { HelperService } from '@core/services/helper.service';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { getRoute } from '@env';
import { map, Observable } from 'rxjs';
import { chiTietGiaiDoan } from '../models/giai-doan-cong-viec';

@Injectable({
	providedIn: 'root'
})
export class GiaiDoanCongViecChiTietService {
	private readonly api = getRoute('congviec-giaidoanchitiet/');
	
	
	constructor(
		private http: HttpClient,
		private helperService: HelperService,
		private httpParamsHeplerService: HttpParamsHeplerService
	) { }

	list(filter?: { search?: string }): Observable<chiTietGiaiDoan[]> {
		let params: HttpParams = new HttpParams();
		if (filter) {
			const conditions: OvicConditionParam[] = [
				{
					conditionName: 'id_giaidoan',
					condition: OvicQueryCondition.like,
					value: filter.search,
				},

			];
			params = this.httpParamsHeplerService.paramsConditionBuilder(conditions);
		}
		return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
	}

	
	get_list_CTGD_count(): Observable<chiTietGiaiDoan[]> {
		const params = new HttpParams().set("pluck", "id,id_giaidoan,chi_tiet_giai_doan,ngay_hethan,trang_thai");
		return this.http.get<Dto>(this.api, { params }).pipe(map(rs => rs.data));
	};

	get_gdctByid(id: number): Observable<any> {
		return this.http.get<Dto>(''.concat(this.api + id.toString())).pipe(map(res => res.data))
	}

	create(data: any): Observable<any> {
		return this.http.post<Dto>(this.api, data);
	}
	edit(id: number, data: any) {
		return this.http.put<Dto>(this.api + id.toString(), data);
	}
	delete(id: number): Observable<any> {
		return this.http.delete<Dto>(this.api + id.toString());
	}

}

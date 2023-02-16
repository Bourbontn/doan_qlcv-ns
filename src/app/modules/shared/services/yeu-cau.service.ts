import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DanhSachYeuCau } from '@modules/shared/models/yeu-cau';
import { getRoute } from '@env';
import { HelperService } from '@core/services/helper.service';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { map, Observable } from 'rxjs';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';

@Injectable({
	providedIn: 'root'
})
export class YeuCauService {


	private readonly api = getRoute('congviec-yeucau/');

	constructor(
		private http: HttpClient,
		private helperService: HelperService,
		private httpParamsHeplerService: HttpParamsHeplerService
	) { }

	list(tinhtrang: number, filter?: { search: string }): Observable<DanhSachYeuCau[]> {
		let params: HttpParams = new HttpParams();
		if (filter) {
			const conditions: OvicConditionParam[] = [
				{
					conditionName: 'tendexuat',
					condition: OvicQueryCondition.like,
					value: '%' + filter.search + '%'
				},
				{
					conditionName: 'nguoidexuat',
					condition: OvicQueryCondition.like,
					value: '%' + filter.search + '%',
					orWhere:'or'
				},
				{
					conditionName: 'trangthai',
					condition: OvicQueryCondition.like,
					value: '%' + filter.search + '%',
					orWhere:'or'
				},
			];
			params = this.httpParamsHeplerService.paramsConditionBuilder(conditions);
		}
		return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
	}
	getDataById( id : number ) : Observable<any[]> {
		return this.http.get<Dto>( ''.concat( this.api , id.toString() ) ).pipe( map( res => res.data ) );
	}
	add(data: any): Observable<any> {
		return this.http.post<Dto>(this.api, data);
	}
	delete(id: number): Observable<any> {
		return this.http.delete<Dto>(this.api + id.toString());
	}

	edit(id: any, data: any) {
		return this.http.put<Dto>(this.api + id.toString(), data);
	}

}

import { Observable } from 'rxjs/observable';
import { Observer } from 'rxjs/observer';

import * as Firebase from 'firebase';

import { FarelRecord, FarelRecordConstructor, FarelRecordAttr } from './farel_record';

export type FarelDefaultRecordFactory<T extends FarelRecordAttr> = FarelRecordConstructor<T> | FarelRecordConstructor<FarelRecord>;

export type FarelOptions<T extends FarelRecordAttr> = { useFactory?: FarelDefaultRecordFactory<T> };

export class FarelQuery<T extends FarelRecordAttr> {
  constructor(protected _ref: FirebaseQuery, protected _options: FarelOptions<T> = {}) {
    this._options.useFactory || (this._options.useFactory = FarelRecord);
  }

  get ref(): FirebaseQuery {
    return this._ref;
  }

  get factory(): FarelDefaultRecordFactory<T> {
    return this._options.useFactory;
  }

  toString() {
    return this._ref.toString();
  }

  chain(query: (ref: FirebaseQuery) => FirebaseQuery) {
    return new FarelQuery(query(this.ref), this._options);
  }
}

export class Farel<T extends FarelRecordAttr> extends FarelQuery<T> {
  private _onAuth: Observable<FirebaseAuthData>;

  constructor(ref: string | Firebase, options: FarelOptions<T> = {}) {
    super(typeof ref === 'string' ? new Firebase(ref) : ref, options);
  }

  get ref(): Firebase {
    return this._ref.ref();
  }

  get onAuth(): Observable<FirebaseAuthData> {
    if (this._onAuth) {
      return this._onAuth;
    }

    this._onAuth = Observable.create((observer: Observer<FirebaseAuthData>) => {
      let authCallback = (authData: FirebaseAuthData) => {
        observer.next(authData);
      }

      this.ref.onAuth(authCallback);

      return () => {
        this.ref.offAuth(authCallback);
      }
    });

    return this._onAuth;
  }

  child(path: string): Farel<T> {
    return new Farel(this.ref.child(path), this._options);
  }
}
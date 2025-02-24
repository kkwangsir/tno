import { IUserListFilter } from 'features/admin/users/interfaces/IUserListFilter';
import React from 'react';
import { useAjaxWrapper, useLookup } from 'store/hooks';
import { IAdminState, useAdminStore } from 'store/slices';
import {
  IPaged,
  ITransferAccount,
  IUserAVOverviewModel,
  IUserFilter,
  IUserModel,
  IUserNotificationModel,
  IUserProductModel,
  IUserReportModel,
  useApiAdminUsers,
} from 'tno-core';

interface IUserController {
  findUsers: (filter: IUserFilter, isSilent?: boolean) => Promise<IPaged<IUserModel>>;
  getUser: (id: number) => Promise<IUserModel>;
  addUser: (model: IUserModel) => Promise<IUserModel>;
  updateUser: (model: IUserModel) => Promise<IUserModel>;
  deleteUser: (model: IUserModel) => Promise<IUserModel>;
  transferAccount: (model: ITransferAccount) => Promise<IUserModel>;
  getDistributionListById: (id: number) => Promise<IUserModel[]>;
  getUserProductSubscriptions: (id: number) => Promise<IUserProductModel[]>;
  getUserReportSubscriptions: (id: number) => Promise<IUserReportModel[]>;
  getUserEveningOverviewSubscriptions: (id: number) => Promise<IUserAVOverviewModel[]>;
  getUserNotificationSubscriptions: (id: number) => Promise<IUserNotificationModel[]>;
  storeFilter: (filter: IUserListFilter) => void;
}

export const useUsers = (): [IAdminState, IUserController] => {
  const api = useApiAdminUsers();
  const dispatch = useAjaxWrapper();
  const [state, store] = useAdminStore();
  const [, lookup] = useLookup();

  const controller = React.useMemo(
    () => ({
      findUsers: async (filter: IUserFilter, isSilent: boolean | undefined = false) => {
        const response = await dispatch<IPaged<IUserModel>>(
          'find-users',
          () => api.findUsers(filter),
          undefined,
          isSilent,
        );
        store.storeUsers(response.data);
        return response.data;
      },
      getUser: async (id: number) => {
        const response = await dispatch<IUserModel>('get-user', () => api.getUser(id));
        store.storeUsers((users) => ({
          ...users,
          items: users.items.map((ds) => {
            if (ds.id === response.data.id) return response.data;
            return ds;
          }),
        }));
        return response.data;
      },
      addUser: async (model: IUserModel) => {
        const response = await dispatch<IUserModel>('add-user', () => api.addUser(model));
        store.storeUsers((users) => ({ ...users, items: [response.data, ...users.items] }));
        await lookup.getLookups();
        return response.data;
      },
      updateUser: async (model: IUserModel) => {
        const response = await dispatch<IUserModel>('update-user', () => api.updateUser(model));
        store.storeUsers((users) => ({
          ...users,
          items: users.items.map((ds) => {
            if (ds.id === response.data.id) return response.data;
            return ds;
          }),
        }));
        await lookup.getLookups();
        return response.data;
      },
      deleteUser: async (model: IUserModel) => {
        const response = await dispatch<IUserModel>('delete-user', () => api.deleteUser(model));
        store.storeUsers((users) => ({
          ...users,
          items: users.items.filter((ds) => ds.id !== response.data.id),
        }));
        await lookup.getLookups();
        return response.data;
      },
      transferAccount: async (model: ITransferAccount) => {
        const response = await dispatch<IUserModel>('transfer-account', () =>
          api.transferAccount(model),
        );
        store.storeUsers((users) => ({
          ...users,
          items: users.items.map((ds) => {
            if (ds.id === response.data.id) return response.data;
            return ds;
          }),
        }));
        return response.data;
      },
      getDistributionListById: async (id: number) => {
        const response = await dispatch<IUserModel[]>('get-distribution-list', () =>
          api.getDistributionListById(id),
        );
        return response.data;
      },
      getUserProductSubscriptions: async (id: number) => {
        const response = await dispatch<IUserProductModel[]>('get-user-product-subscriptions', () =>
          api.getUserProductSubscriptions(id),
        );
        return response.data;
      },
      getUserReportSubscriptions: async (id: number) => {
        const response = await dispatch<IUserReportModel[]>('get-user-report-subscriptions', () =>
          api.getUserReportSubscriptions(id),
        );
        return response.data;
      },
      getUserEveningOverviewSubscriptions: async (id: number) => {
        const response = await dispatch<IUserAVOverviewModel[]>(
          'get-user-evening-overview-subscriptions',
          () => api.getUserEveningOverviewSubscriptions(id),
        );
        return response.data;
      },
      getUserNotificationSubscriptions: async (id: number) => {
        const response = await dispatch<IUserNotificationModel[]>(
          'get-user-notification-subscriptions',
          () => api.getUserNotificationSubscriptions(id),
        );
        return response.data;
      },
      storeFilter: store.storeUserFilter,
    }),
    [api, dispatch, lookup, store],
  );

  return [state, controller];
};

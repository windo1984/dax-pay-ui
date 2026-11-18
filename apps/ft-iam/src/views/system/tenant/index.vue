<script lang="ts" setup>
  import { computed, onMounted, reactive, ref } from 'vue';

  import { useAccess } from '@vben/access';

  import { message, Modal } from 'antdv-next';

  import {
    TenantApi,
    TenantPackageApi,
    type Tenant,
    type TenantPackage,
    type TenantSaveParam,
  } from '#/api/system/tenant.api';
  import { $t } from '#/locales';

  defineOptions({ name: 'SystemTenant' });

  const { hasAccessByCodes } = useAccess();

  const loading = ref(false);
  const list = ref<Tenant[]>([]);
  const total = ref(0);
  const packages = ref<TenantPackage[]>([]);
  const query = reactive({
    pageNo: 1,
    pageSize: 10,
    name: '',
    code: '',
    status: undefined as number | undefined,
  });

  const canCreate = computed(() => hasAccessByCodes(['system:tenant:create']));
  const canUpdate = computed(() => hasAccessByCodes(['system:tenant:update']));
  const canDelete = computed(() => hasAccessByCodes(['system:tenant:delete']));

  const modalOpen = ref(false);
  const submitting = ref(false);
  const editing = ref(false);
  const form = reactive<TenantSaveParam>({ status: 0, accountCount: 10 });

  // antdv-next 的表格列必须走 columns 数组 + #bodyCell 插槽，
  // a-table-column 的子节点会被当成"分组表头"，不会再作为单元格渲染
  const columns = computed(() => [
    { key: 'code', title: $t('system.tenant.col.code'), dataIndex: 'code', width: 140 },
    { key: 'name', title: $t('system.tenant.col.name'), dataIndex: 'name' },
    { key: 'contactName', title: $t('system.tenant.col.contactName'), width: 120 },
    { key: 'contactMobile', title: $t('system.tenant.col.contactMobile'), width: 130 },
    { key: 'accountCount', title: $t('system.tenant.col.accountCount'), dataIndex: 'accountCount', width: 90 },
    { key: 'expireTime', title: $t('system.tenant.col.expireTime'), width: 140 },
    { key: 'status', title: $t('system.tenant.col.status'), width: 90 },
    { key: 'action', title: $t('system.tenant.col.action'), width: 140, fixed: 'right' },
  ]);

  const statusOptions = computed(() => [
    { label: $t('common.status.enable'), value: 0 },
    { label: $t('common.status.disable'), value: 1 },
  ]);

  // 套餐列表（弹窗内的表格）
  const packageColumns = computed(() => [
    { key: 'code', title: $t('system.tenant.package.colCode'), dataIndex: 'code', width: 140 },
    { key: 'name', title: $t('system.tenant.package.colName'), dataIndex: 'name' },
    { key: 'status', title: $t('system.tenant.package.colStatus'), width: 90 },
    { key: 'action', title: $t('system.tenant.package.colAction'), width: 120 },
  ]);

  // 套餐管理
  const packageOpen = ref(false);
  const packageLoading = ref(false);
  const packageFormOpen = ref(false);
  const packageEditing = ref(false);
  const packageForm = reactive<any>({ status: 0, menuIds: [] });

  async function load() {
    loading.value = true;
    try {
      const { data } = await TenantApi.page({
        pageNo: query.pageNo,
        pageSize: query.pageSize,
        code: query.code || undefined,
        name: query.name || undefined,
        status: query.status,
      });
      list.value = data?.list ?? [];
      total.value = data?.total ?? 0;
    } finally {
      loading.value = false;
    }
  }

  async function loadPackages() {
    const { data } = await TenantPackageApi.list();
    packages.value = data ?? [];
  }

  function resetQuery() {
    query.name = '';
    query.code = '';
    query.status = undefined;
    query.pageNo = 1;
    load();
  }

  function openCreate() {
    editing.value = false;
    Object.assign(form, {
      id: undefined,
      code: '',
      name: '',
      contactName: '',
      contactMobile: '',
      status: 0,
      websites: '',
      packageId: packages.value[0]?.id ?? null,
      expireTime: '',
      accountCount: 10,
      remark: '',
    });
    modalOpen.value = true;
  }

  function openEdit(row: Tenant) {
    editing.value = true;
    Object.assign(form, {
      id: row.id,
      code: row.code,
      name: row.name,
      contactUserId: row.contactUserId ?? null,
      contactName: row.contactName ?? '',
      contactMobile: row.contactMobile ?? '',
      status: row.status ?? 0,
      websites: row.websites ?? '',
      packageId: row.packageId ?? null,
      expireTime: row.expireTime ?? '',
      accountCount: row.accountCount ?? 10,
      remark: row.remark ?? '',
    });
    modalOpen.value = true;
  }

  async function submit() {
    if (!form.code || !form.name) {
      message.warning($t('system.tenant.msg.required'));
      return;
    }
    submitting.value = true;
    try {
      if (editing.value) {
        await TenantApi.update({ ...form });
        message.success($t('common.msg.updated'));
      } else {
        await TenantApi.create({ ...form });
        message.success($t('common.msg.created'));
      }
      modalOpen.value = false;
      await load();
    } catch (error: any) {
      message.error(error?.response?.data?.msg || $t('common.msg.saveFailed'));
    } finally {
      submitting.value = false;
    }
  }

  function remove(row: Tenant) {
    Modal.confirm({
      content: $t('system.tenant.msg.deleteConfirm', { name: row.name }),
      onOk: async () => {
        await TenantApi.delete(row.id);
        message.success($t('common.msg.deleted'));
        await load();
      },
      title: $t('common.msg.deleteConfirmTitle'),
    });
  }

  async function openPackages() {
    packageOpen.value = true;
    packageLoading.value = true;
    try {
      await loadPackages();
    } finally {
      packageLoading.value = false;
    }
  }

  function openPackageCreate() {
    packageEditing.value = false;
    Object.assign(packageForm, { id: undefined, code: '', name: '', status: 0, remark: '', menuIds: [] });
    packageFormOpen.value = true;
  }

  function openPackageEdit(row: TenantPackage) {
    packageEditing.value = true;
    Object.assign(packageForm, {
      id: row.id,
      code: row.code,
      name: row.name,
      status: row.status ?? 0,
      remark: row.remark ?? '',
      menuIds: row.menuIds ?? [],
    });
    packageFormOpen.value = true;
  }

  async function submitPackage() {
    try {
      if (packageEditing.value) {
        await TenantPackageApi.update({ ...packageForm });
      } else {
        await TenantPackageApi.create({ ...packageForm });
      }
      message.success($t('common.msg.saved'));
      packageFormOpen.value = false;
      await loadPackages();
    } catch (error: any) {
      message.error(error?.response?.data?.msg || $t('common.msg.saveFailed'));
    }
  }

  async function removePackage(row: TenantPackage) {
    Modal.confirm({
      content: $t('system.tenant.msg.packageDeleteConfirm', { name: row.name }),
      onOk: async () => {
        await TenantPackageApi.delete(row.id);
        message.success($t('common.msg.deleted'));
        await loadPackages();
      },
      title: $t('common.msg.deleteConfirmTitle'),
    });
  }

  onMounted(async () => {
    await loadPackages();
    await load();
  });
</script>

<template>
  <div class="page">
    <a-card :bordered="false">
      <a-form layout="inline" :model="query" class="query">
        <a-form-item :label="$t('system.tenant.col.name')">
          <a-input v-model:value="query.name" allow-clear :placeholder="$t('common.placeholder.fuzzy')" />
        </a-form-item>
        <a-form-item :label="$t('system.tenant.col.code')">
          <a-input v-model:value="query.code" allow-clear />
        </a-form-item>
        <a-form-item :label="$t('system.tenant.col.status')">
          <a-select
            v-model:value="query.status"
            allow-clear
            :placeholder="$t('common.placeholder.all')"
            style="width: 110px"
            :options="statusOptions"
          />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="load">{{ $t('common.action.query') }}</a-button>
            <a-button @click="resetQuery">{{ $t('common.action.reset') }}</a-button>
            <a-button v-if="canCreate" type="primary" ghost @click="openCreate">{{ $t('system.tenant.create') }}</a-button>
            <a-button @click="openPackages">{{ $t('system.tenant.package.manage') }}</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <a-table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="{
          current: query.pageNo,
          pageSize: query.pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t: number) => $t('common.total', { total: t }),
        }"
        row-key="id"
        size="middle"
        @change="(pag: any) => { query.pageNo = pag.current; query.pageSize = pag.pageSize; load(); }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'contactName'">{{ record.contactName || '—' }}</template>
          <template v-else-if="column.key === 'contactMobile'">{{ record.contactMobile || '—' }}</template>
          <template v-else-if="column.key === 'expireTime'">{{ record.expireTime || '—' }}</template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 0 ? 'green' : 'red'">
              {{ record.status === 0 ? $t('common.status.enable') : $t('common.status.disable') }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a v-if="canUpdate" @click="openEdit(record)">{{ $t('common.action.edit') }}</a>
              <a v-if="canDelete" class="danger" @click="remove(record)">{{ $t('common.action.delete') }}</a>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="modalOpen"
      :confirm-loading="submitting"
      :title="editing ? $t('system.tenant.edit') : $t('system.tenant.create')"
      destroy-on-close
      width="680px"
      @ok="submit"
    >
      <a-form :model="form" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-row :gutter="8">
          <a-col :span="12">
            <a-form-item :label="$t('system.tenant.form.code')" required>
              <a-input v-model:value="form.code" :disabled="editing" :placeholder="$t('system.tenant.form.codePlaceholder')" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="$t('system.tenant.form.name')" required>
              <a-input v-model:value="form.name" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="$t('system.tenant.form.contactName')">
              <a-input v-model:value="form.contactName" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="$t('system.tenant.form.contactMobile')">
              <a-input v-model:value="form.contactMobile" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="$t('system.tenant.form.package')">
              <a-select
                v-model:value="form.packageId"
                allow-clear
                :options="packages.map((p) => ({ label: p.name, value: p.id }))"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="$t('system.tenant.form.accountCount')">
              <a-input-number v-model:value="form.accountCount" :min="1" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="$t('system.tenant.form.expireTime')">
              <a-input v-model:value="form.expireTime" :placeholder="$t('system.tenant.form.expireTimePlaceholder')" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="$t('system.tenant.form.status')">
              <a-select v-model:value="form.status" :options="statusOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item :label="$t('system.tenant.form.websites')" :label-col="{ span: 3 }" :wrapper-col="{ span: 20 }">
              <a-input v-model:value="form.websites" :placeholder="$t('system.tenant.form.websitesPlaceholder')" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item :label="$t('system.tenant.form.remark')" :label-col="{ span: 3 }" :wrapper-col="{ span: 20 }">
              <a-textarea v-model:value="form.remark" :rows="2" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <a-modal v-model:open="packageOpen" :title="$t('system.tenant.package.title')" width="720px" :footer="null" destroy-on-close>
      <div class="pkg-toolbar">
        <a-button type="primary" size="small" @click="openPackageCreate">{{ $t('system.tenant.package.create') }}</a-button>
      </div>
      <a-table
        :columns="packageColumns"
        :data-source="packages"
        :loading="packageLoading"
        :pagination="false"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 0 ? 'green' : 'red'">
              {{ record.status === 0 ? $t('common.status.enable') : $t('common.status.disable') }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a @click="openPackageEdit(record)">{{ $t('common.action.edit') }}</a>
              <a class="danger" @click="removePackage(record)">{{ $t('common.action.delete') }}</a>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-modal>

    <a-modal
      v-model:open="packageFormOpen"
      :title="packageEditing ? $t('system.tenant.package.edit') : $t('system.tenant.package.create')"
      destroy-on-close
      @ok="submitPackage"
    >
      <a-form :model="packageForm" :label-col="{ span: 5 }" :wrapper-col="{ span: 17 }">
        <a-form-item :label="$t('system.tenant.package.formCode')" required>
          <a-input v-model:value="packageForm.code" :disabled="packageEditing" />
        </a-form-item>
        <a-form-item :label="$t('system.tenant.package.formName')" required>
          <a-input v-model:value="packageForm.name" />
        </a-form-item>
        <a-form-item :label="$t('system.tenant.form.status')">
          <a-select v-model:value="packageForm.status" :options="statusOptions" />
        </a-form-item>
        <a-form-item :label="$t('system.tenant.package.formRemark')">
          <a-textarea v-model:value="packageForm.remark" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
  .page {
    padding: 16px;
  }

  .query {
    margin-bottom: 12px;
  }

  .pkg-toolbar {
    margin-bottom: 8px;
    text-align: right;
  }

  .danger {
    color: hsl(var(--destructive));
  }
</style>

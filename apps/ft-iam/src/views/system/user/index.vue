<script lang="ts" setup>
  import { computed, onMounted, reactive, ref } from 'vue';

  import { useAccess } from '@vben/access';

  import { message, Modal } from 'antdv-next';

  import { DeptApi } from '#/api/system/dept.api';
  import { PostApi } from '#/api/system/post.api';
  import { RoleApi } from '#/api/system/role.api';
  import { UserApi, type User, type UserSaveParam } from '#/api/system/user.api';
  import { $t } from '#/locales';

  defineOptions({ name: 'SystemUser' });

  const { hasAccessByCodes } = useAccess();

  const loading = ref(false);
  const list = ref<User[]>([]);
  const total = ref(0);
  const query = reactive({
    pageNo: 1,
    pageSize: 10,
    username: '',
    status: undefined as number | undefined,
  });

  const canCreate = computed(() => hasAccessByCodes(['system:user:create']));
  const canUpdate = computed(() => hasAccessByCodes(['system:user:update']));
  const canDelete = computed(() => hasAccessByCodes(['system:user:delete']));
  const canReset = computed(() => hasAccessByCodes(['system:user:reset-password']));

  const deptOptions = ref<{ label: string; value: number }[]>([]);
  const roleOptions = ref<{ label: string; value: number }[]>([]);
  const postOptions = ref<{ label: string; value: number }[]>([]);

  // 弹窗
  const modalOpen = ref(false);
  const submitting = ref(false);
  const editing = ref(false);
  const form = reactive<UserSaveParam>({ status: 0, sex: 1, clientCode: 'admin' });

  // antdv-next 的表格列必须走 columns 数组 + #bodyCell 插槽，
  // a-table-column 的子节点会被当成"分组表头"，不会再作为单元格渲染
  const columns = computed(() => [
    { key: 'username', title: $t('system.user.col.username'), dataIndex: 'username' },
    { key: 'nickname', title: $t('system.user.col.nickname'), dataIndex: 'nickname' },
    { key: 'deptId', title: $t('system.user.col.dept'), width: 140 },
    { key: 'mobile', title: $t('system.user.col.mobile'), dataIndex: 'mobile', width: 140 },
    { key: 'clientCode', title: $t('system.user.col.clientCode'), dataIndex: 'clientCode', width: 100 },
    { key: 'status', title: $t('system.user.col.status'), width: 90 },
    { key: 'createTime', title: $t('system.user.col.createTime'), width: 180 },
    { key: 'action', title: $t('system.user.col.action'), width: 260, fixed: 'right' },
  ]);

  const statusOptions = computed(() => [
    { label: $t('common.status.enable'), value: 0 },
    { label: $t('common.status.disable'), value: 1 },
  ]);

  const sexOptions = computed(() => [
    { label: $t('common.sex.male'), value: 1 },
    { label: $t('common.sex.female'), value: 2 },
    { label: $t('common.sex.unknown'), value: 0 },
  ]);

  const clientCodeOptions = computed(() => [
    { label: 'admin', value: 'admin' },
    { label: 'merchant', value: 'merchant' },
    { label: 'app', value: 'app' },
  ]);

  // 重置密码弹窗
  const resetOpen = ref(false);
  const resetTarget = ref<null | User>(null);
  const resetPasswordValue = ref('');

  async function load() {
    loading.value = true;
    try {
      const { data } = await UserApi.page({
        pageNo: query.pageNo,
        pageSize: query.pageSize,
        username: query.username || undefined,
        status: query.status,
      });
      list.value = data?.list ?? [];
      total.value = data?.total ?? 0;
    } finally {
      loading.value = false;
    }
  }

  async function loadOptions() {
    const [depts, roles, posts] = await Promise.all([
      DeptApi.simpleList(),
      RoleApi.simpleList(),
      PostApi.list(),
    ]);
    const flatten = (nodes: any[] = [], prefix = ''): { label: string; value: number }[] =>
      nodes.flatMap((node) => [
        { label: `${prefix}${node.name}`, value: node.id },
        ...flatten(node.children ?? [], `${prefix}${node.name} / `),
      ]);
    deptOptions.value = flatten(depts.data ?? []);
    roleOptions.value = (roles.data ?? []).map((it) => ({ label: `${it.name}（${it.code}）`, value: it.id }));
    postOptions.value = (posts.data ?? []).map((it) => ({ label: it.name, value: it.id }));
  }

  function resetQuery() {
    query.username = '';
    query.status = undefined;
    query.pageNo = 1;
    load();
  }

  function openCreate() {
    editing.value = false;
    Object.assign(form, {
      id: undefined,
      username: '',
      nickname: '',
      password: '',
      deptId: null,
      email: '',
      mobile: '',
      sex: 1,
      status: 0,
      remark: '',
      clientCode: 'admin',
      roleIds: [],
      postIds: [],
    });
    modalOpen.value = true;
  }

  function openEdit(row: User) {
    editing.value = true;
    Object.assign(form, {
      id: row.id,
      username: row.username,
      nickname: row.nickname,
      password: undefined,
      deptId: row.deptId ?? null,
      email: row.email,
      mobile: row.mobile,
      sex: row.sex ?? 1,
      status: row.status ?? 0,
      remark: row.remark,
      clientCode: row.clientCode ?? 'admin',
      roleIds: row.roleIds ?? [],
      postIds: row.postIds ?? [],
    });
    modalOpen.value = true;
  }

  async function submit() {
    if (!form.username) {
      message.warning($t('system.user.msg.usernameRequired'));
      return;
    }
    submitting.value = true;
    try {
      if (editing.value) {
        await UserApi.update({ ...form });
        message.success($t('common.msg.updated'));
      } else {
        await UserApi.create({ ...form });
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

  async function toggleStatus(row: User) {
    const next = row.status === 0 ? 1 : 0;
    await UserApi.updateStatus(row.id, next);
    message.success(next === 0 ? $t('system.user.msg.enabled') : $t('system.user.msg.disabled'));
    await load();
  }

  function resetPassword(row: User) {
    resetTarget.value = row;
    resetPasswordValue.value = '';
    resetOpen.value = true;
  }

  async function submitReset() {
    if (!resetTarget.value) return;
    try {
      await UserApi.resetPassword(resetTarget.value.id, resetPasswordValue.value);
      message.success($t('system.user.msg.passwordReset'));
      resetOpen.value = false;
    } catch (error: any) {
      message.error(error?.response?.data?.msg || $t('system.user.msg.resetFailed'));
    }
  }

  function remove(row: User) {
    Modal.confirm({
      content: $t('system.user.msg.deleteConfirm', { name: row.username }),
      onOk: async () => {
        await UserApi.delete(row.id);
        message.success($t('common.msg.deleted'));
        await load();
      },
      title: $t('common.msg.deleteConfirmTitle'),
    });
  }

  onMounted(async () => {
    await loadOptions();
    await load();
  });
</script>

<template>
  <div class="page">
    <a-card variant="borderless">
      <a-form layout="inline" :model="query" class="query">
        <a-form-item :label="$t('system.user.col.username')">
          <a-input v-model:value="query.username" allow-clear :placeholder="$t('common.placeholder.fuzzy')" @press-enter="load" />
        </a-form-item>
        <a-form-item :label="$t('system.user.col.status')">
          <a-select
            v-model:value="query.status"
            allow-clear
            :placeholder="$t('common.placeholder.all')"
            style="width: 120px"
            :options="statusOptions"
          />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="load">{{ $t('common.action.query') }}</a-button>
            <a-button @click="resetQuery">{{ $t('common.action.reset') }}</a-button>
            <a-button v-if="canCreate" type="primary" ghost @click="openCreate">{{ $t('system.user.create') }}</a-button>
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
          <template v-if="column.key === 'deptId'">
            {{ deptOptions.find((d) => d.value === record.deptId)?.label || '—' }}
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 0 ? 'green' : 'red'">
              {{ record.status === 0 ? $t('common.status.enable') : $t('common.status.disable') }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ (record.createTime || '').replace('T', ' ').slice(0, 19) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a v-if="canUpdate" @click="openEdit(record)">{{ $t('common.action.edit') }}</a>
              <a v-if="canReset" @click="resetPassword(record)">{{ $t('system.user.resetPassword') }}</a>
              <a v-if="canUpdate" @click="toggleStatus(record)">
                {{ record.status === 0 ? $t('common.status.disable') : $t('common.status.enable') }}
              </a>
              <a v-if="canDelete" class="danger" @click="remove(record)">{{ $t('common.action.delete') }}</a>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="modalOpen"
      :confirm-loading="submitting"
      :title="editing ? $t('system.user.edit') : $t('system.user.create')"
      destroy-on-hidden
      width="720px"
      @ok="submit"
    >
      <a-form :model="form" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item :label="$t('system.user.form.username')" required>
              <a-input v-model:value="form.username" :disabled="editing" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="$t('system.user.form.nickname')">
              <a-input v-model:value="form.nickname" />
            </a-form-item>
          </a-col>
          <a-col v-if="!editing" :span="12">
            <a-form-item :label="$t('system.user.form.initPassword')">
              <a-input-password v-model:value="form.password" :placeholder="$t('system.user.form.initPasswordPlaceholder')" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="$t('system.user.form.dept')">
              <a-select v-model:value="form.deptId" allow-clear :options="deptOptions" show-search option-filter-prop="label" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="$t('system.user.form.mobile')">
              <a-input v-model:value="form.mobile" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="$t('system.user.form.email')">
              <a-input v-model:value="form.email" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="$t('system.user.form.sex')">
              <a-select v-model:value="form.sex" :options="sexOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="$t('system.user.form.status')">
              <a-select v-model:value="form.status" :options="statusOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="$t('system.user.form.clientCode')">
              <a-select v-model:value="form.clientCode" :options="clientCodeOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item :label="$t('system.user.form.role')" :label-col="{ span: 3 }" :wrapper-col="{ span: 20 }">
              <a-select v-model:value="form.roleIds" mode="multiple" :options="roleOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item :label="$t('system.user.form.post')" :label-col="{ span: 3 }" :wrapper-col="{ span: 20 }">
              <a-select v-model:value="form.postIds" mode="multiple" :options="postOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item :label="$t('system.user.form.remark')" :label-col="{ span: 3 }" :wrapper-col="{ span: 20 }">
              <a-textarea v-model:value="form.remark" :rows="2" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="resetOpen"
      :title="$t('system.user.resetTitle')"
      destroy-on-hidden
      width="420px"
      @ok="submitReset"
    >
      <p>{{ $t('system.user.resetUser', { name: resetTarget?.username }) }}</p>
      <a-input-password v-model:value="resetPasswordValue" :placeholder="$t('system.user.resetPlaceholder')" />
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

  .danger {
    color: hsl(var(--destructive));
  }
</style>

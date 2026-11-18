<script lang="ts" setup>
  import { computed, onMounted, reactive, ref } from 'vue';

  import { useAccess } from '@vben/access';

  import { message, Modal } from 'antdv-next';

  import type { MenuItem } from '#/api/auth.api';
  import { MenuApi } from '#/api/system/menu.api';
  import { RoleApi, type Role, type RoleSaveParam } from '#/api/system/role.api';

  defineOptions({ name: 'SystemRole' });

  const { hasAccessByCodes } = useAccess();

  const loading = ref(false);
  const list = ref<Role[]>([]);
  const total = ref(0);
  const query = reactive({
    pageNo: 1,
    pageSize: 10,
    name: '',
    code: '',
    status: undefined as number | undefined,
  });

  const canCreate = computed(() => hasAccessByCodes(['system:role:create']));
  const canUpdate = computed(() => hasAccessByCodes(['system:role:update']));
  const canDelete = computed(() => hasAccessByCodes(['system:role:delete']));
  const canAssign = computed(() => hasAccessByCodes(['system:role:assign-menu']));

  const modalOpen = ref(false);
  const submitting = ref(false);
  const editing = ref(false);
  const form = reactive<RoleSaveParam>({ status: 0, dataScope: 1, sort: 0, type: 2, clientCode: 'admin' });

  // antdv-next 的表格列必须走 columns 数组 + #bodyCell 插槽，
  // a-table-column 的子节点会被当成"分组表头"，不会再作为单元格渲染
  const columns = [
    { key: 'name', title: '角色名称', dataIndex: 'name' },
    { key: 'code', title: '编码', dataIndex: 'code', width: 160 },
    { key: 'sort', title: '排序', dataIndex: 'sort', width: 80 },
    { key: 'dataScope', title: '数据范围', width: 130 },
    { key: 'type', title: '类型', width: 90 },
    { key: 'status', title: '状态', width: 90 },
    { key: 'action', title: '操作', width: 230, fixed: 'right' },
  ];

  // 菜单授权
  const assignOpen = ref(false);
  const assignTarget = ref<null | Role>(null);
  const menuTree = ref<MenuItem[]>([]);
  const checkedKeys = ref<number[]>([]);

  const dataScopeOptions = [
    { label: '全部数据', value: 1 },
    { label: '本部门及子部门', value: 2 },
    { label: '本部门', value: 3 },
    { label: '仅本人', value: 4 },
    { label: '自定义', value: 5 },
  ];

  async function load() {
    loading.value = true;
    try {
      const { data } = await RoleApi.page({
        pageNo: query.pageNo,
        pageSize: query.pageSize,
        name: query.name || undefined,
        code: query.code || undefined,
        status: query.status,
      });
      list.value = data?.list ?? [];
      total.value = data?.total ?? 0;
    } finally {
      loading.value = false;
    }
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
      name: '',
      code: '',
      sort: 0,
      dataScope: 1,
      dataScopeDeptIds: [],
      status: 0,
      type: 2,
      remark: '',
      clientCode: 'admin',
      menuIds: [],
    });
    modalOpen.value = true;
  }

  function openEdit(row: Role) {
    editing.value = true;
    Object.assign(form, {
      id: row.id,
      name: row.name,
      code: row.code,
      sort: row.sort ?? 0,
      dataScope: row.dataScope ?? 1,
      dataScopeDeptIds: row.dataScopeDeptIds ?? [],
      status: row.status ?? 0,
      type: row.type ?? 2,
      remark: row.remark,
      clientCode: row.clientCode ?? 'admin',
      menuIds: row.menuIds ?? [],
    });
    modalOpen.value = true;
  }

  async function submit() {
    if (!form.name || !form.code) {
      message.warning('请填写角色名称与编码');
      return;
    }
    submitting.value = true;
    try {
      if (editing.value) {
        await RoleApi.update({ ...form });
        message.success('更新成功');
      } else {
        await RoleApi.create({ ...form });
        message.success('新增成功');
      }
      modalOpen.value = false;
      await load();
    } catch (error: any) {
      message.error(error?.response?.data?.msg || '保存失败');
    } finally {
      submitting.value = false;
    }
  }

  async function toggleStatus(row: Role) {
    await RoleApi.updateStatus(row.id, row.status === 0 ? 1 : 0);
    message.success('状态已更新');
    await load();
  }

  async function openAssign(row: Role) {
    assignTarget.value = row;
    const [{ data: menus }, { data: detail }] = await Promise.all([
      MenuApi.list(),
      RoleApi.get(row.id),
    ]);
    menuTree.value = menus ?? [];
    checkedKeys.value = detail?.menuIds ?? [];
    assignOpen.value = true;
  }

  async function submitAssign() {
    if (!assignTarget.value) return;
    // 只提交叶子级勾选：后端按 menuIds 覆盖角色菜单关联
    await RoleApi.assignMenu(assignTarget.value.id, checkedKeys.value);
    message.success('菜单授权已保存');
    assignOpen.value = false;
    await load();
  }

  function remove(row: Role) {
    Modal.confirm({
      content: `确认删除角色「${row.name}」？`,
      onOk: async () => {
        await RoleApi.delete(row.id);
        message.success('已删除');
        await load();
      },
      title: '删除确认',
    });
  }

  onMounted(load);
</script>

<template>
  <div class="page">
    <a-card :bordered="false">
      <a-form layout="inline" :model="query" class="query">
        <a-form-item label="名称">
          <a-input v-model:value="query.name" allow-clear placeholder="模糊匹配" />
        </a-form-item>
        <a-form-item label="编码">
          <a-input v-model:value="query.code" allow-clear placeholder="如 common" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select
            v-model:value="query.status"
            allow-clear
            placeholder="全部"
            style="width: 110px"
            :options="[
              { label: '启用', value: 0 },
              { label: '停用', value: 1 },
            ]"
          />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="load">查询</a-button>
            <a-button @click="resetQuery">重置</a-button>
            <a-button v-if="canCreate" type="primary" ghost @click="openCreate">新增角色</a-button>
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
          showTotal: (t: number) => `共 ${t} 条`,
        }"
        row-key="id"
        size="middle"
        @change="(pag: any) => { query.pageNo = pag.current; query.pageSize = pag.pageSize; load(); }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'dataScope'">
            {{ dataScopeOptions.find((d) => d.value === record.dataScope)?.label || '—' }}
          </template>
          <template v-else-if="column.key === 'type'">
            <a-tag :color="record.internal ? 'blue' : 'default'">{{ record.internal ? '内置' : '自定义' }}</a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 0 ? 'green' : 'red'">{{ record.status === 0 ? '启用' : '停用' }}</a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a v-if="canUpdate" @click="openEdit(record)">编辑</a>
              <a v-if="canAssign" @click="openAssign(record)">菜单授权</a>
              <a v-if="canUpdate" @click="toggleStatus(record)">{{ record.status === 0 ? '停用' : '启用' }}</a>
              <a v-if="canDelete" class="danger" @click="remove(record)">删除</a>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="modalOpen"
      :confirm-loading="submitting"
      :title="editing ? '编辑角色' : '新增角色'"
      destroy-on-close
      width="620px"
      @ok="submit"
    >
      <a-form :model="form" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="角色名称" required>
          <a-input v-model:value="form.name" />
        </a-form-item>
        <a-form-item label="角色编码" required>
          <a-input v-model:value="form.code" :disabled="editing" placeholder="唯一，如 operator" />
        </a-form-item>
        <a-form-item label="排序">
          <a-input-number v-model:value="form.sort" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item label="数据范围">
          <a-select v-model:value="form.dataScope" :options="dataScopeOptions" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select
            v-model:value="form.status"
            :options="[
              { label: '启用', value: 0 },
              { label: '停用', value: 1 },
            ]"
          />
        </a-form-item>
        <a-form-item label="身份域">
          <a-select
            v-model:value="form.clientCode"
            :options="[
              { label: 'admin', value: 'admin' },
              { label: 'merchant', value: 'merchant' },
              { label: 'app', value: 'app' },
            ]"
          />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="form.remark" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="assignOpen" title="菜单授权" width="560px" destroy-on-close @ok="submitAssign">
      <p v-if="assignTarget">角色：{{ assignTarget.name }}（{{ assignTarget.code }}）</p>
      <div class="tree-box">
        <a-tree
          v-model:checked-keys="checkedKeys"
          :tree-data="menuTree"
          checkable
          :field-names="{ children: 'children', key: 'id', title: 'name' }"
          default-expand-all
        />
      </div>
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

  .tree-box {
    max-height: 420px;
    padding: 8px;
    overflow: auto;
    border: 1px solid hsl(var(--border));
    border-radius: 6px;
  }

  .danger {
    color: hsl(var(--destructive));
  }
</style>

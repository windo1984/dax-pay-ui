<script lang="ts" setup>
  import { computed, onMounted, reactive, ref } from 'vue';

  import { useAccess } from '@vben/access';

  import { message, Modal } from 'antdv-next';

  import type { MenuItem } from '#/api/auth.api';
  import { MenuApi, type MenuSaveParam } from '#/api/system/menu.api';

  defineOptions({ name: 'SystemMenu' });

  const { hasAccessByCodes } = useAccess();

  const loading = ref(false);
  const tree = ref<MenuItem[]>([]);
  const query = reactive({ name: '', status: undefined as number | undefined, clientCode: 'admin' });

  const canCreate = computed(() => hasAccessByCodes(['system:menu:create']));
  const canUpdate = computed(() => hasAccessByCodes(['system:menu:update']));
  const canDelete = computed(() => hasAccessByCodes(['system:menu:delete']));

  const modalOpen = ref(false);
  const submitting = ref(false);
  const editing = ref(false);
  const form = reactive<MenuSaveParam>({
    parentId: 0,
    type: 2,
    sort: 0,
    status: 0,
    visible: true,
    keepAlive: true,
    alwaysShow: false,
    clientCode: 'admin',
  });

  // antdv-next 的表格列必须走 columns 数组 + #bodyCell 插槽，
  // a-table-column 的子节点会被当成"分组表头"，不会再作为单元格渲染
  const columns = [
    { key: 'name', title: '名称', dataIndex: 'name' },
    { key: 'icon', title: '图标', width: 150 },
    { key: 'type', title: '类型', width: 80 },
    { key: 'path', title: '路由', width: 150 },
    { key: 'component', title: '组件', width: 180 },
    { key: 'permission', title: '权限标识', width: 180 },
    { key: 'status', title: '状态', width: 90 },
    { key: 'action', title: '操作', width: 180, fixed: 'right' },
  ];

  const typeOptions = [
    { label: '目录', value: 1 },
    { label: '菜单', value: 2 },
    { label: '按钮', value: 3 },
  ];

  async function load() {
    loading.value = true;
    try {
      const { data } = await MenuApi.list({
        clientCode: query.clientCode,
        name: query.name || undefined,
        status: query.status,
      });
      tree.value = data ?? [];
    } finally {
      loading.value = false;
    }
  }

  function resetQuery() {
    query.name = '';
    query.status = undefined;
    load();
  }

  function openCreate(parent?: MenuItem) {
    editing.value = false;
    Object.assign(form, {
      id: undefined,
      parentId: parent?.id ?? 0,
      name: '',
      permission: '',
      type: parent ? 2 : 1,
      sort: 0,
      path: '',
      component: '',
      componentName: '',
      icon: '',
      status: 0,
      visible: true,
      keepAlive: true,
      alwaysShow: false,
      clientCode: query.clientCode,
      remark: '',
    });
    modalOpen.value = true;
  }

  function openEdit(row: MenuItem) {
    editing.value = true;
    Object.assign(form, {
      id: row.id,
      parentId: row.parentId ?? 0,
      name: row.name,
      i18nKey: row.i18nKey ?? '',
      permission: row.permission ?? '',
      type: row.type,
      sort: row.sort ?? 0,
      path: row.path ?? '',
      component: row.component ?? '',
      componentName: row.componentName ?? '',
      redirect: row.redirect ?? '',
      icon: row.icon ?? '',
      status: row.status ?? 0,
      visible: row.visible !== false,
      keepAlive: row.keepAlive !== false,
      alwaysShow: row.alwaysShow === true,
      badge: row.badge ?? '',
      link: row.link ?? '',
      remark: row.remark ?? '',
      clientCode: row.clientCode ?? query.clientCode,
    });
    modalOpen.value = true;
  }

  async function submit() {
    if (!form.name) {
      message.warning('请填写菜单名称');
      return;
    }
    if (form.type !== 3 && !form.path) {
      message.warning('目录/菜单必须填写路由路径');
      return;
    }
    if (form.type === 2 && !form.component) {
      message.warning('菜单必须填写视图组件路径，如 system/user/index');
      return;
    }
    submitting.value = true;
    try {
      if (editing.value) {
        await MenuApi.update({ ...form });
        message.success('更新成功');
      } else {
        await MenuApi.create({ ...form });
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

  function remove(row: MenuItem) {
    Modal.confirm({
      content: `确认删除菜单「${row.name}」？存在子节点时后端会拒绝。`,
      onOk: async () => {
        await MenuApi.delete(row.id);
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
            <a-button v-if="canCreate" type="primary" ghost @click="openCreate()">新增目录/菜单</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <a-table
        :columns="columns"
        :data-source="tree"
        :loading="loading"
        :pagination="false"
        row-key="id"
        size="middle"
        default-expand-all-rows
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'icon'">{{ record.icon || '—' }}</template>
          <template v-else-if="column.key === 'type'">
            <a-tag :color="record.type === 1 ? 'blue' : record.type === 2 ? 'green' : 'default'">
              {{ record.type === 1 ? '目录' : record.type === 2 ? '菜单' : '按钮' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'path'">{{ record.path || '—' }}</template>
          <template v-else-if="column.key === 'component'">{{ record.component || '—' }}</template>
          <template v-else-if="column.key === 'permission'">{{ record.permission || '—' }}</template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 0 ? 'green' : 'red'">{{ record.status === 0 ? '启用' : '停用' }}</a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a v-if="canUpdate" @click="openEdit(record)">编辑</a>
              <a v-if="canCreate" @click="openCreate(record)">新增子项</a>
              <a v-if="canDelete" class="danger" @click="remove(record)">删除</a>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="modalOpen"
      :confirm-loading="submitting"
      :title="editing ? '编辑菜单' : '新增菜单'"
      destroy-on-close
      width="720px"
      @ok="submit"
    >
      <a-form :model="form" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-row :gutter="8">
          <a-col :span="12">
            <a-form-item label="名称" required>
              <a-input v-model:value="form.name" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="类型" required>
              <a-select v-model:value="form.type" :options="typeOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="上级 ID">
              <a-input-number v-model:value="form.parentId" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="排序">
              <a-input-number v-model:value="form.sort" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col v-if="form.type !== 3" :span="12">
            <a-form-item label="路由路径">
              <a-input v-model:value="form.path" placeholder="目录用 /system，菜单用 user" />
            </a-form-item>
          </a-col>
          <a-col v-if="form.type === 2" :span="12">
            <a-form-item label="视图组件">
              <a-input v-model:value="form.component" placeholder="system/user/index" />
            </a-form-item>
          </a-col>
          <a-col v-if="form.type === 2" :span="12">
            <a-form-item label="组件名">
              <a-input v-model:value="form.componentName" placeholder="SystemUser（keep-alive 用）" />
            </a-form-item>
          </a-col>
          <a-col v-if="form.type !== 1" :span="12">
            <a-form-item label="权限标识">
              <a-input v-model:value="form.permission" placeholder="system:user:query" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="图标">
              <a-input v-model:value="form.icon" placeholder="lucide:users / ep:user" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="状态">
              <a-select
                v-model:value="form.status"
                :options="[
                  { label: '启用', value: 0 },
                  { label: '停用', value: 1 },
                ]"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="显示在菜单">
              <a-switch v-model:checked="form.visible" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="缓存页面">
              <a-switch v-model:checked="form.keepAlive" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item label="备注" :label-col="{ span: 3 }" :wrapper-col="{ span: 20 }">
              <a-textarea v-model:value="form.remark" :rows="2" />
            </a-form-item>
          </a-col>
        </a-row>
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

  .danger {
    color: hsl(var(--destructive));
  }
</style>

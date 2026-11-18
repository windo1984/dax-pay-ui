<script lang="ts" setup>
  import { computed, onMounted, reactive, ref } from 'vue';

  import { useAccess } from '@vben/access';

  import { message, Modal } from 'antdv-next';

  import { DeptApi, type Dept, type DeptSaveParam } from '#/api/system/dept.api';

  defineOptions({ name: 'SystemDept' });

  const { hasAccessByCodes } = useAccess();

  const loading = ref(false);
  const tree = ref<Dept[]>([]);
  const query = reactive({ name: '', status: undefined as number | undefined });

  const canCreate = computed(() => hasAccessByCodes(['system:dept:create']));
  const canUpdate = computed(() => hasAccessByCodes(['system:dept:update']));
  const canDelete = computed(() => hasAccessByCodes(['system:dept:delete']));

  const modalOpen = ref(false);
  const submitting = ref(false);
  const editing = ref(false);
  const form = reactive<DeptSaveParam>({ parentId: 0, sort: 0, status: 0 });

  // 上级部门下拉（把树拍平成带层级前缀的列表）
  const parentOptions = ref<{ label: string; value: number }[]>([]);

  function flatten(nodes: Dept[] = [], prefix = ''): { label: string; value: number }[] {
    return nodes.flatMap((node) => [
      { label: `${prefix}${node.name}`, value: node.id },
      ...flatten(node.children ?? [], `${prefix}${node.name} / `),
    ]);
  }

  async function load() {
    loading.value = true;
    try {
      const [{ data: list }, { data: simple }] = await Promise.all([
        DeptApi.list({ name: query.name || undefined, status: query.status }),
        DeptApi.simpleList(),
      ]);
      tree.value = list ?? [];
      parentOptions.value = flatten(simple ?? []);
    } finally {
      loading.value = false;
    }
  }

  function resetQuery() {
    query.name = '';
    query.status = undefined;
    load();
  }

  function openCreate(parent?: Dept) {
    editing.value = false;
    Object.assign(form, {
      id: undefined,
      parentId: parent?.id ?? 0,
      name: '',
      sort: 0,
      leaderUserId: null,
      phone: '',
      email: '',
      status: 0,
    });
    modalOpen.value = true;
  }

  function openEdit(row: Dept) {
    editing.value = true;
    Object.assign(form, {
      id: row.id,
      parentId: row.parentId ?? 0,
      name: row.name,
      sort: row.sort ?? 0,
      leaderUserId: row.leaderUserId ?? null,
      phone: row.phone ?? '',
      email: row.email ?? '',
      status: row.status ?? 0,
    });
    modalOpen.value = true;
  }

  async function submit() {
    if (!form.name) {
      message.warning('请填写部门名称');
      return;
    }
    submitting.value = true;
    try {
      if (editing.value) {
        await DeptApi.update({ ...form });
        message.success('更新成功');
      } else {
        await DeptApi.create({ ...form });
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

  function remove(row: Dept) {
    Modal.confirm({
      content: `确认删除部门「${row.name}」？`,
      onOk: async () => {
        await DeptApi.delete(row.id);
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
        <a-form-item label="部门名称">
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
            <a-button v-if="canCreate" type="primary" ghost @click="openCreate()">新增部门</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <a-table
        :data-source="tree"
        :loading="loading"
        :pagination="false"
        default-expand-all-rows
        row-key="id"
        size="middle"
      >
        <a-table-column key="name" title="部门名称" data-index="name" />
        <a-table-column key="sort" title="排序" data-index="sort" :width="80" />
        <a-table-column key="leaderUserId" title="负责人 ID" :width="110">
          <template #default="{ record }">{{ record.leaderUserId ?? '—' }}</template>
        </a-table-column>
        <a-table-column key="phone" title="联系电话" :width="140">
          <template #default="{ record }">{{ record.phone || '—' }}</template>
        </a-table-column>
        <a-table-column key="status" title="状态" :width="90">
          <template #default="{ record }">
            <a-tag :color="record.status === 0 ? 'green' : 'red'">{{ record.status === 0 ? '启用' : '停用' }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column key="action" title="操作" :width="170" fixed="right">
          <template #default="{ record }">
            <a-space>
              <a v-if="canUpdate" @click="openEdit(record)">编辑</a>
              <a v-if="canCreate" @click="openCreate(record)">新增子部门</a>
              <a v-if="canDelete" class="danger" @click="remove(record)">删除</a>
            </a-space>
          </template>
        </a-table-column>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="modalOpen"
      :confirm-loading="submitting"
      :title="editing ? '编辑部门' : '新增部门'"
      destroy-on-close
      width="560px"
      @ok="submit"
    >
      <a-form :model="form" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="上级部门">
          <a-select
            v-model:value="form.parentId"
            :options="[{ label: '顶级部门', value: 0 }, ...parentOptions]"
            show-search
            option-filter-prop="label"
          />
        </a-form-item>
        <a-form-item label="部门名称" required>
          <a-input v-model:value="form.name" />
        </a-form-item>
        <a-form-item label="排序">
          <a-input-number v-model:value="form.sort" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item label="负责人 ID">
          <a-input-number v-model:value="form.leaderUserId" :min="1" style="width: 100%" />
        </a-form-item>
        <a-form-item label="联系电话">
          <a-input v-model:value="form.phone" />
        </a-form-item>
        <a-form-item label="邮箱">
          <a-input v-model:value="form.email" />
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

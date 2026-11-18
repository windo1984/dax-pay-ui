<script lang="ts" setup>
  import { computed, onMounted, reactive, ref } from 'vue';

  import { useAccess } from '@vben/access';

  import { message, Modal } from 'antdv-next';

  import { PostApi, type Post, type PostSaveParam } from '#/api/system/post.api';

  defineOptions({ name: 'SystemPost' });

  const { hasAccessByCodes } = useAccess();

  const loading = ref(false);
  const list = ref<Post[]>([]);
  const query = reactive({ name: '', code: '', status: undefined as number | undefined });

  const canCreate = computed(() => hasAccessByCodes(['system:post:create']));
  const canUpdate = computed(() => hasAccessByCodes(['system:post:update']));
  const canDelete = computed(() => hasAccessByCodes(['system:post:delete']));

  const modalOpen = ref(false);
  const submitting = ref(false);
  const editing = ref(false);
  const form = reactive<PostSaveParam>({ status: 0, sort: 0 });

  async function load() {
    loading.value = true;
    try {
      const { data } = await PostApi.list({
        code: query.code || undefined,
        name: query.name || undefined,
        status: query.status,
      });
      list.value = data ?? [];
    } finally {
      loading.value = false;
    }
  }

  function resetQuery() {
    query.name = '';
    query.code = '';
    query.status = undefined;
    load();
  }

  function openCreate() {
    editing.value = false;
    Object.assign(form, { id: undefined, code: '', name: '', sort: 0, status: 0, remark: '' });
    modalOpen.value = true;
  }

  function openEdit(row: Post) {
    editing.value = true;
    Object.assign(form, {
      id: row.id,
      code: row.code,
      name: row.name,
      sort: row.sort ?? 0,
      status: row.status ?? 0,
      remark: row.remark ?? '',
    });
    modalOpen.value = true;
  }

  async function submit() {
    if (!form.name || !form.code) {
      message.warning('请填写岗位名称与编码');
      return;
    }
    submitting.value = true;
    try {
      if (editing.value) {
        await PostApi.update({ ...form });
        message.success('更新成功');
      } else {
        await PostApi.create({ ...form });
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

  function remove(row: Post) {
    Modal.confirm({
      content: `确认删除岗位「${row.name}」？`,
      onOk: async () => {
        await PostApi.delete(row.id);
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
        <a-form-item label="岗位名称">
          <a-input v-model:value="query.name" allow-clear placeholder="模糊匹配" />
        </a-form-item>
        <a-form-item label="编码">
          <a-input v-model:value="query.code" allow-clear />
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
            <a-button v-if="canCreate" type="primary" ghost @click="openCreate">新增岗位</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <a-table :data-source="list" :loading="loading" :pagination="false" row-key="id" size="middle">
        <a-table-column key="code" title="编码" data-index="code" :width="180" />
        <a-table-column key="name" title="岗位名称" data-index="name" />
        <a-table-column key="sort" title="排序" data-index="sort" :width="80" />
        <a-table-column key="status" title="状态" :width="90">
          <template #default="{ record }">
            <a-tag :color="record.status === 0 ? 'green' : 'red'">{{ record.status === 0 ? '启用' : '停用' }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column key="remark" title="备注">
          <template #default="{ record }">{{ record.remark || '—' }}</template>
        </a-table-column>
        <a-table-column key="action" title="操作" :width="140" fixed="right">
          <template #default="{ record }">
            <a-space>
              <a v-if="canUpdate" @click="openEdit(record)">编辑</a>
              <a v-if="canDelete" class="danger" @click="remove(record)">删除</a>
            </a-space>
          </template>
        </a-table-column>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="modalOpen"
      :confirm-loading="submitting"
      :title="editing ? '编辑岗位' : '新增岗位'"
      destroy-on-close
      width="520px"
      @ok="submit"
    >
      <a-form :model="form" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="岗位编码" required>
          <a-input v-model:value="form.code" :disabled="editing" />
        </a-form-item>
        <a-form-item label="岗位名称" required>
          <a-input v-model:value="form.name" />
        </a-form-item>
        <a-form-item label="排序">
          <a-input-number v-model:value="form.sort" :min="0" style="width: 100%" />
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
        <a-form-item label="备注">
          <a-textarea v-model:value="form.remark" :rows="2" />
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

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const companiesDir = path.join(process.cwd(), 'src/data/companies');
  if (!fs.existsSync(companiesDir)) {
    console.log('No companies directory found, skipping seed.');
    return;
  }

  const files = fs.readdirSync(companiesDir).filter((f) => f.endsWith('.json'));
  console.log(`Found ${files.length} company files to seed.`);

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(companiesDir, file), 'utf-8');
      const data = JSON.parse(raw);

      const company = await prisma.company.upsert({
        where: {
          name_corpCode: {
            name: data.company_name || file.replace('.json', ''),
            corpCode: data.company_code || '',
          },
        },
        create: {
          name: data.company_name || file.replace('.json', ''),
          corpCode: data.company_code || null,
          sector: data.sector || '기타',
        },
        update: {},
      });

      await prisma.analysis.create({
        data: {
          companyId: company.id,
          reportYear: data.report_year || '',
          provider: 'seed',
          financialData: data,
        },
      });

      console.log(`  Seeded: ${data.company_name || file}`);
    } catch (err) {
      console.error(`  Failed to seed ${file}:`, err);
    }
  }

  console.log('Seed completed.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

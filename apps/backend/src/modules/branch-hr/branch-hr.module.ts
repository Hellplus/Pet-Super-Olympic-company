import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchApplication } from './entities/branch-application.entity';
import { ApprovalRecord } from './entities/approval-record.entity';
import { Expert } from './entities/expert.entity';
import { ExpertCertificate } from './entities/expert-certificate.entity';
import { ExpertAssignment } from './entities/expert-assignment.entity';
import { BranchHrService } from './branch-hr.service';
import { BranchHrController } from './branch-hr.controller';
import { BranchHrPublicController } from './branch-hr-public.controller';
import { OrganizationModule } from '../organization/organization.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    forwardRef(() => OrganizationModule),
    forwardRef(() => UserModule),
    TypeOrmModule.forFeature([BranchApplication, ApprovalRecord, Expert, ExpertCertificate, ExpertAssignment]),
  ],
  controllers: [BranchHrController, BranchHrPublicController],
  providers: [BranchHrService],
  exports: [BranchHrService],
})
export class BranchHrModule {}
